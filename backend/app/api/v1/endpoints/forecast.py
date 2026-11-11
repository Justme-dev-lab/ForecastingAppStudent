from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_registry
from app.schemas.forecast import ForecastRequest, ForecastResponse
from app.services.registry import ModelRegistry

router = APIRouter(tags=["Forecast"])


@router.post("/forecast/{model_id}", response_model=ForecastResponse)
def forecast(model_id: str, payload: ForecastRequest, reg: ModelRegistry = Depends(get_registry)):
    """Forecast NUM dan LIT tahun berikutnya. Wajib: num_lag1 dan lit_lag1."""
    if model_id not in reg.models:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' tidak ditemukan")
    try:
        return reg.forecast(model_id, payload.features)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
