from fastapi import APIRouter, Depends

from app.api.deps import get_registry
from app.services.registry import ModelRegistry

router = APIRouter(tags=["Health"])


@router.get("/health")
def health(reg: ModelRegistry = Depends(get_registry)):
    return {"status": "ok", "model_loaded": reg.is_loaded, "models": sorted(reg.models)}
