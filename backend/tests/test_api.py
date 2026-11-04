"""Jalankan dari folder backend/:  pytest -v
Butuh file model asli di ml_models/ (ft_*.pt + prep_*.pkl)."""
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


def test_health(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200 and r.json()["model_loaded"] is True


def test_models_lists_fields(client):
    ms = client.get("/api/v1/models").json()
    assert ms[0]["is_default"] is True
    assert any(f["name"] == "num_lag1" and f["required"] for f in ms[0]["numeric_fields"])


def test_predict_minimal(client):
    r = client.post("/api/v1/predict/E_gabungan", json={"features": {"num_lag1": 52.0}})
    assert r.status_code == 200
    body = r.json()
    assert 0 < body["prediction"] < 100 and body["previous_score"] == 52.0


def test_predict_requires_num_lag1(client):
    assert client.post("/api/v1/predict/E_gabungan", json={"features": {}}).status_code == 422


def test_predict_unknown_model(client):
    assert client.post("/api/v1/predict/ZZ", json={"features": {"num_lag1": 50}}).status_code == 404


# --- UJI REGRESI vs notebook (sangat disarankan) ---
# 1. Di notebook Kaggle, ambil satu baris test, hitung prediksinya dengan model yang sama
#    (lihat README bagian "Verifikasi"), lalu isi FEATURES & EXPECTED di bawah.
# 2. Hapus @pytest.mark.skip.
@pytest.mark.skip(reason="isi FEATURES dan EXPECTED dari notebook")
def test_matches_notebook(client):
    FEATURES = {}          # dict fitur mentah dari notebook
    EXPECTED = 0.0         # prediksi notebook untuk baris yang sama
    r = client.post("/api/v1/predict/E_gabungan", json={"features": FEATURES})
    assert r.json()["prediction"] == pytest.approx(EXPECTED, abs=1e-3)
