"""Registry model: memuat semua pasangan ft_<ID>.pt + prep_<ID>.pkl dari ml_models/."""
import logging
import math
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd
import torch

from app.core.config import settings
from app.ml.loader import build_model, load_checkpoint, load_prep
from app.schemas.forecast import (CategoricalFieldInfo, ForecastResponse, ModelInfo,
                                  NumericFieldInfo)
from app.services.labels import group_for, label_for

log = logging.getLogger("uvicorn.error")

DISPLAY = {
    "A_identitas_wilayah": ("Model A: Identitas & Wilayah", "Hanya identitas sekolah, wilayah, dan skor tahun lalu."),
    "B_sumberdaya_sekolah": ("Model B: Sumber Daya Sekolah", "Sumber daya sekolah (pendidik, ruang kelas, internet, dst.) dan skor tahun lalu."),
    "C_sosek_siswa": ("Model C: Sosial-Ekonomi Siswa", "Survei latar belakang siswa (agregat sekolah) dan skor tahun lalu."),
    "D_sosek_agregat_iklim_akreditasi": ("Model D: Iklim & Akreditasi", "Indikator iklim sekolah, akreditasi, dan SES agregat, plus skor tahun lalu."),
    "E_gabungan": ("Model E: Gabungan (utama)", "Semua kelompok fitur. RMSE validasi terbaik di antara model yang dibandingkan."),
    "E_sel": ("Model E-sel: Fitur Terpilih", "56 fitur teratas hasil seleksi (termasuk skor NUM dan LIT tahun lalu)."),
}

# Nama target sesuai urutan keluaran model (y_mu/y_sd di checkpoint punya panjang yang sama).
# Target pertama = NUM (rata-rata 52.50 sama dengan model lama). Target kedua DIDUGA LIT
# (rata-rata 61.21) -- konfirmasi dengan notebook.
TARGETS = ["num", "lit"]

# RMSE uji per model. KOSONGKAN sampai diisi dari notebook versi baru (angka model lama tidak berlaku).
PERSISTENCE_RMSE: float | None = None
RMSE_TEST: dict[str, float] = {}
torch.set_num_threads(2)


@dataclass
class LoadedModel:
    id: str
    model: torch.nn.Module
    prep: object
    ckpt: dict


class ModelRegistry:
    def __init__(self):
        self.models: dict[str, LoadedModel] = {}

    # ---------- loading ----------
    def load_all(self, models_dir: str) -> None:
        folder = Path(models_dir)
        for pt in sorted(folder.glob("ft_*.pt")):
            mid = pt.stem[len("ft_"):]
            pkl = folder / f"prep_{mid}.pkl"
            if not pkl.exists():
                log.warning("Lewati %s: %s tidak ditemukan", pt.name, pkl.name)
                continue
            try:
                ckpt = load_checkpoint(pt)
                prep = load_prep(pkl)
                assert list(prep.num_cols) == list(ckpt["num_cols"]), "num_cols prep != checkpoint"
                assert list(prep.cat_cols) == list(ckpt["cat_cols"]), "cat_cols prep != checkpoint"
                self.models[mid] = LoadedModel(mid, build_model(ckpt), prep, ckpt)
                log.info("Model %s dimuat (%d numerik, %d kategorik)", mid,
                         len(ckpt["num_cols"]), len(ckpt["cat_cols"]))
            except Exception as e:  # satu model rusak tidak boleh mematikan server
                log.error("Gagal memuat %s: %s", pt.name, e)

    @property
    def is_loaded(self) -> bool:
        return bool(self.models)

    # ---------- metadata untuk frontend ----------
    def info(self, mid: str) -> ModelInfo:
        m = self.models[mid]
        prep, ck = m.prep, m.ckpt
        q = prep.qt.quantiles_
        num = []
        for i, c in enumerate(ck["num_cols"]):
            num.append(NumericFieldInfo(
                name=c, label=label_for(c), group=group_for(c), required=(c in ("num_lag1", "lit_lag1")),
                median=float(prep.med[c]), min=float(q[0, i]), max=float(q[-1, i])))
        cat = [CategoricalFieldInfo(name=c, label=label_for(c), group=group_for(c),
                                    options=list(prep.vocab[c].keys()))
               for c in ck["cat_cols"]]
        name, desc = DISPLAY.get(mid, (f"Model {mid}", ""))
        return ModelInfo(id=mid, name=name, description=desc,
                         is_default=(mid == settings.default_model_id),
                         rmse_test=RMSE_TEST.get(mid), rmse_persistence=PERSISTENCE_RMSE,
                         numeric_fields=num, categorical_fields=cat)

    def list_info(self) -> list[ModelInfo]:
        items = [self.info(mid) for mid in self.models]
        return sorted(items, key=lambda x: (not x.is_default, x.id))

    # ---------- forecast ----------
    def forecast(self, mid: str, features: dict) -> ForecastResponse:
        m = self.models[mid]
        num_cols, cat_cols = m.ckpt["num_cols"], m.ckpt["cat_cols"]

        unknown = set(features) - set(num_cols) - set(cat_cols)
        if unknown:
            raise ValueError(f"Field tidak dikenal untuk model {mid}: {sorted(unknown)}")
        required = [c for c in ("num_lag1", "lit_lag1") if c in num_cols]
        for c in required:
            if features.get(c) in (None, ""):
                raise ValueError(f"Field '{c}' (skor tahun sebelumnya) wajib diisi.")

        row, n_default, n_missing_cat = {}, 0, 0
        for c in num_cols:
            v = features.get(c)
            if v is None or v == "":
                row[c], n_default = np.nan, n_default + 1
            else:
                try:
                    fv = float(v)
                except (TypeError, ValueError):
                    raise ValueError(f"Field '{c}' harus berupa angka.")
                if not math.isfinite(fv):
                    raise ValueError(f"Field '{c}' tidak valid.")
                row[c] = fv
        for c in cat_cols:
            v = features.get(c)
            if v is None or v == "":
                row[c] = None                      # -> indeks UNK (0). PERINGATAN: UNK tidak pernah muncul
                n_missing_cat += 1                 #    saat training, jadi hasilnya kurang bisa diandalkan.
            else:
                v = str(v)
                if v not in m.prep.vocab[c]:
                    raise ValueError(f"Nilai '{v}' tidak dikenal untuk '{c}'.")
                row[c] = v

        df = pd.DataFrame([row], columns=list(num_cols) + list(cat_cols))
        xn, xc = m.prep.transform(df)
        with torch.inference_mode():
            out = m.model(torch.from_numpy(xn), torch.from_numpy(xc)).reshape(-1).numpy()
        mu = np.atleast_1d(np.asarray(m.ckpt["y_mu"], dtype=float))
        sd = np.atleast_1d(np.asarray(m.ckpt["y_sd"], dtype=float))
        raw = out.astype(float) * sd + mu                      # kembalikan ke skala asli, per target

        names = TARGETS[: len(raw)]
        previous = {t: float(features[f"{t}_lag1"]) for t in names if f"{t}_lag1" in features
                    and features[f"{t}_lag1"] not in (None, "")}
        values = {t: float(v) for t, v in zip(names, raw)}
        changes = {t: values[t] - previous[t] for t in previous}
        fc_num = values["num"]
        prev = previous.get("num")
        return ForecastResponse(model_id=mid, forecast_num=fc_num, previous_score=prev,
                               change=(fc_num - prev) if prev is not None else None,
                               forecast=values, previous=previous, changes=changes,
                               n_filled_by_default=n_default,
                               n_missing_categorical=n_missing_cat,
                               rmse_test=RMSE_TEST.get(mid), rmse_persistence=PERSISTENCE_RMSE)


registry = ModelRegistry()
