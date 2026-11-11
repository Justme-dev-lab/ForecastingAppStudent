from pydantic import BaseModel, Field


class NumericFieldInfo(BaseModel):
    name: str
    label: str
    group: str
    required: bool
    median: float          # dipakai model bila field dikosongkan
    min: float             # rentang data training (acuan, bukan batas keras)
    max: float


class CategoricalFieldInfo(BaseModel):
    name: str
    label: str
    group: str
    required: bool = False
    options: list[str]


class ModelInfo(BaseModel):
    id: str
    name: str
    description: str
    is_default: bool
    rmse_test: float | None = None          # galat uji model ini (fold main_2025)
    rmse_persistence: float | None = None   # galat uji "salin skor tahun lalu" (pembanding)
    numeric_fields: list[NumericFieldInfo]
    categorical_fields: list[CategoricalFieldInfo]


class ForecastRequest(BaseModel):
    # Hanya kirim field yang diisi. Numerik kosong -> median training.
    features: dict[str, float | str | None] = Field(default_factory=dict)

    model_config = {
        "json_schema_extra": {
            "example": {"features": {"num_lag1": 52.3, "sts_sek": "negeri", "jumlah_peserta_didik__lag1": 400}}
        }
    }


class ForecastResponse(BaseModel):
    model_id: str
    forecast_num: float                    # forecast NUM (target pertama), sama dengan forecast['num']
    previous_score: float | None = None    # num_lag1, untuk pembanding
    change: float | None = None            # forecast_num - previous_score
    forecast: dict[str, float] = {}        # semua target, mis. {"num": 54.0, "lit": 62.3}
    previous: dict[str, float] = {}        # skor tahun lalu per target
    changes: dict[str, float] = {}         # selisih per target
    n_filled_by_default: int               # jumlah field numerik yang diisi median
    n_missing_categorical: int = 0         # kategori kosong -> indeks UNK (tidak pernah dilatih!)
    rmse_test: float | None = None
    rmse_persistence: float | None = None
