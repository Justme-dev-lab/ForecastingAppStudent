from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_registry
from app.schemas.prediction import PredictRequest, PredictResponse
from app.services.registry import ModelRegistry

router = APIRouter(tags=["Prediction"])


@router.post("/predict/{model_id}", response_model=PredictResponse)
def predict(model_id: str, payload: PredictRequest, reg: ModelRegistry = Depends(get_registry)):
    if model_id not in reg.models:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' tidak ditemukan")
    try:
        return reg.predict(model_id, payload.features)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
