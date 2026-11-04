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
    numeric_fields: list[NumericFieldInfo]
    categorical_fields: list[CategoricalFieldInfo]


class PredictRequest(BaseModel):
    # Hanya kirim field yang diisi. Numerik kosong -> median training.
    features: dict[str, float | str | None] = Field(default_factory=dict)

    model_config = {
        "json_schema_extra": {
            "example": {"features": {"num_lag1": 52.3, "sts_sek": "negeri", "jumlah_peserta_didik__lag1": 400}}
        }
    }


class PredictResponse(BaseModel):
    model_id: str
    prediction: float
    previous_score: float | None = None    # num_lag1, untuk pembanding
    change: float | None = None            # prediction - previous_score
    n_filled_by_default: int               # jumlah field numerik yang diisi median
