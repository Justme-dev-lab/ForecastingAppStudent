"""Pemuat artefak: checkpoint .pt (bobot) dan prep_*.pkl (preprocessor)."""
import pickle
from pathlib import Path

import torch

from app.ml.ftt import FTTransformer
from app.ml.prep import TabPrep

# prep_*.pkl hanya boleh merujuk ke library data ini + TabPrep.
# Unpickler biasa bisa menjalankan kode sembarang, jadi dibatasi.
_ALLOWED_PREFIXES = ("numpy", "pandas", "sklearn", "builtins", "collections", "copyreg", "_codecs")


class _PrepUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if module == "__main__" and name == "TabPrep":
            return TabPrep
        if module.split(".")[0] in _ALLOWED_PREFIXES:
            return super().find_class(module, name)
        raise pickle.UnpicklingError(f"Objek tidak diizinkan di prep pickle: {module}.{name}")


def load_prep(path: Path) -> TabPrep:
    with open(path, "rb") as f:
        return _PrepUnpickler(f).load()


def load_checkpoint(path: Path) -> dict:
    # Utamakan weights_only=True (hanya tensor & tipe dasar).
    try:
        return torch.load(path, map_location="cpu", weights_only=True)
    except pickle.UnpicklingError:
        # Checkpoint versi baru menyimpan y_mu/y_sd sebagai numpy array, yang ditolak mode aman.
        # File ini berasal dari folder ml_models milik sendiri, jadi dimuat tanpa pembatasan.
        # JANGAN memuat checkpoint dari sumber yang tidak dipercaya dengan cara ini.
        return torch.load(path, map_location="cpu", weights_only=False)


def build_model(ckpt: dict) -> FTTransformer:
    n_out = ckpt["state_dict"]["head.2.weight"].shape[0]      # 1 target (lama) atau 2 target (baru)
    model = FTTransformer(len(ckpt["num_cols"]), ckpt["cards"], ckpt["hp"], n_out=n_out)
    model.load_state_dict(ckpt["state_dict"], strict=True)   # nama & ukuran bobot harus cocok persis
    model.eval()
    return model
