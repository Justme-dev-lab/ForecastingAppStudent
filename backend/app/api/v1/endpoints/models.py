from fastapi import APIRouter, Depends

from app.api.deps import get_registry
from app.schemas.forecast import ModelInfo
from app.services.registry import ModelRegistry

router = APIRouter(tags=["Models"])


@router.get("/models", response_model=list[ModelInfo])
def list_models(reg: ModelRegistry = Depends(get_registry)):
    """Daftar model + definisi field form. Frontend membangun form dari sini."""
    return reg.list_info()
