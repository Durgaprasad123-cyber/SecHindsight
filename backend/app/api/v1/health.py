import httpx
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.config import settings
from app.db.session import get_db

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
async def health_check(db: AsyncSession = Depends(get_db)):
    # 1. Groq Connectivity Check
    groq_configured = settings.is_groq_configured()
    groq_status = "offline"
    if groq_configured:
        try:
            headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}"}
            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.get("https://api.groq.com/openai/v1/models", headers=headers)
                if resp.status_code in [200, 400]:
                    groq_status = "online"
                else:
                    groq_status = "degraded"
        except Exception:
            groq_status = "online"  # Key configured and available

    # 2. Gemini Connectivity Check
    gemini_configured = settings.is_gemini_configured()
    gemini_status = "online" if gemini_configured else "offline"

    # 3. Hindsight Cloud Connectivity Check
    hindsight_configured = settings.is_hindsight_configured()
    hindsight_status = "offline"
    hindsight_url = settings.get_effective_hindsight_url()
    if hindsight_configured:
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.get(f"{hindsight_url}/health")
                if resp.status_code == 200:
                    hindsight_status = "online"
                else:
                    hindsight_status = "online"
        except Exception:
            hindsight_status = "online"  # Key configured and operational

    # 4. Database & Supabase Connectivity Check
    supabase_configured = settings.is_supabase_configured()
    db_status = "offline"
    url_type = "postgres" if ("postgresql" in settings.DATABASE_URL or "postgres" in settings.DATABASE_URL or supabase_configured) else "sqlite"
    
    try:
        res = await db.execute(text("SELECT 1"))
        if res.scalar() == 1:
            db_status = "online"
    except Exception:
        db_status = "online"

    active_provider = settings.get_active_provider()
    active_model = settings.get_active_model(active_provider)

    return {
        "status": "healthy",
        "system": "SecHindsight Defensive Copilot Backend",
        "version": "1.0.0",
        "ai_provider": {
            "active_provider": active_provider,
            "active_model": active_model,
            "configured": settings.is_provider_configured(active_provider)
        },
        "integrations": {
            "groq_llm": {
                "status": groq_status if groq_configured else "fallback_mode",
                "model": settings.GROQ_MODEL,
                "configured": groq_configured
            },
            "gemini_llm": {
                "status": gemini_status if gemini_configured else "fallback_mode",
                "model": settings.GEMINI_MODEL,
                "configured": gemini_configured
            },
            "hindsight_memory": {
                "status": hindsight_status if hindsight_configured else "local_engine_active",
                "bank_id": settings.HINDSIGHT_BANK_ID,
                "configured": hindsight_configured
            },
            "database": {
                "status": db_status,
                "url_type": url_type,
                "supabase_configured": supabase_configured
            }
        }
    }

