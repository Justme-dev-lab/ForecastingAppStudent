"""Jalankan dari folder backend/:  pytest -v
Butuh file model asli di ml_models/ (ft_*.pt + prep_*.pkl dari run training yang sama)."""
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app

MODELS = Path(__file__).resolve().parents[1] / "ml_models"
pytestmark = pytest.mark.skipif(not (MODELS / "ft_E_gabungan.pt").exists(), reason="model belum disalin")


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:        # "with" -> lifespan jalan -> model dimuat
        yield c


def minimal_features(model_info):
    """Fitur paling sedikit yang diterima model: semua field wajib, diisi median training."""
    return {f["name"]: f["median"] for f in model_info["numeric_fields"] if f["required"]}


def test_health(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200 and r.json()["model_loaded"] is True


def test_models_lists_fields(client):
    ms = client.get("/api/v1/models").json()
    assert ms[0]["is_default"] is True
    names = {f["name"]: f for f in ms[0]["numeric_fields"]}
    assert names["num_lag1"]["required"]
    if "lit_lag1" in names:                       # checkpoint dua target
        assert names["lit_lag1"]["required"]


def test_every_loaded_model_forecasts(client):
    """Setiap model yang termuat (A-E, E_sel) harus bisa menghasilkan forecast dengan fitur wajib saja."""
    for m in client.get("/api/v1/models").json():
        r = client.post(f"/api/v1/forecast/{m['id']}", json={"features": minimal_features(m)})
        assert r.status_code == 200, (m["id"], r.text)
        body = r.json()
        assert 0 < body["forecast_num"] < 100, m["id"]
        assert set(body["forecast"]) >= {"num"}, m["id"]
        assert all(0 < v < 100 for v in body["forecast"].values()), (m["id"], body["forecast"])


def test_forecast_two_targets(client):
    r = client.post("/api/v1/forecast/E_gabungan", json={"features": {"num_lag1": 52.0, "lit_lag1": 60.0}})
    assert r.status_code == 200
    body = r.json()
    assert body["previous_score"] == 52.0 and body["previous"]["lit"] == 60.0
    assert body["forecast_num"] == body["forecast"]["num"]
    assert body["changes"]["num"] == pytest.approx(body["forecast_num"] - 52.0)


def test_forecast_requires_both_scores(client):
    assert client.post("/api/v1/forecast/E_gabungan", json={"features": {}}).status_code == 422
    r = client.post("/api/v1/forecast/E_gabungan", json={"features": {"num_lag1": 52.0}})
    assert r.status_code == 422 and "lit_lag1" in r.json()["detail"]


def test_forecast_unknown_model(client):
    assert client.post("/api/v1/forecast/ZZ", json={"features": {"num_lag1": 50}}).status_code == 404


# --- UJI REGRESI vs notebook (sangat disarankan) ---
# 1. Di notebook, ambil satu baris test, hitung forecast-nya dengan model yang sama (README bagian 4),
#    lalu isi FEATURES dan EXPECTED_NUM / EXPECTED_LIT di bawah.
# 2. Hapus @pytest.mark.skip.
@pytest.mark.skip(reason="isi FEATURES, EXPECTED_NUM, EXPECTED_LIT dari notebook")
def test_matches_notebook(client):
    FEATURES = {}           # dict fitur mentah dari notebook
    EXPECTED_NUM = 0.0      # forecast NUM notebook untuk baris yang sama
    EXPECTED_LIT = 0.0      # forecast LIT notebook untuk baris yang sama
    r = client.post("/api/v1/forecast/E_gabungan", json={"features": FEATURES})
    p = r.json()["forecast"]
    assert p["num"] == pytest.approx(EXPECTED_NUM, abs=1e-3)
    assert p["lit"] == pytest.approx(EXPECTED_LIT, abs=1e-3)
