from fastapi import APIRouter
from app.services.ai_service import ai_service
from app.core.config import settings

router = APIRouter(prefix="/ai", tags=["AI Reasoning Provider"])

@router.get("/provider")
async def get_ai_provider_status():
    """
    Returns current active AI reasoning provider status (Groq or Gemini).
    Never exposes API keys or sensitive credentials.
    """
    info = ai_service.get_provider_info()
    return {
        "provider": info["provider"],
        "model": info["model"],
        "configured": info["configured"],
        "supported_providers": info["supported_providers"],
        "active_provider_setting": settings.AI_PROVIDER
    }
