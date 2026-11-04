from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Path dihitung dari lokasi file ini, jadi tidak bergantung pada folder
# tempat uvicorn dijalankan.
BASE_DIR = Path(__file__).resolve().parents[2]  # folder backend/


class Settings(BaseSettings):
    app_name: str = "API Prediksi Nilai NUM Sekolah SMA"
    app_version: str = "1.0.0"
    api_v1_prefix: str = "/api/v1"

    models_dir: str = str(BASE_DIR / "ml_models")
    default_model_id: str = "E_gabungan"   # model dengan RMSE validasi terbaik di notebook

    cors_origins: list[str] = [
        "http://localhost:5173",   # Vite
        "http://localhost:3000",
    ]

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
