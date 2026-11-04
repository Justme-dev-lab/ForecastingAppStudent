from app.services.registry import ModelRegistry, registry


def get_registry() -> ModelRegistry:
    return registry
