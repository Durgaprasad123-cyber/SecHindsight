import logging
from typing import Dict, Any, Optional
from app.core.config import settings
from app.services.groq_service import groq_service
from app.services.gemini_service import gemini_service

logger = logging.getLogger("sec_hindsight.ai_service")

class AIService:
    """
    Unified AI Reasoning Provider Router.
    Abstacts AI reasoning providers (Groq and Gemini) for SecHindsight agents.
    Hindsight remains the persistent organizational memory layer.
    """

    ALLOWED_PROVIDERS = {"groq", "gemini"}

    def get_provider_info(self, provider: Optional[str] = None) -> Dict[str, Any]:
        """Returns details about the active or requested AI reasoning provider."""
        req_p = (provider or settings.get_active_provider()).lower().strip()
        if req_p not in self.ALLOWED_PROVIDERS:
            req_p = "groq"

        model = settings.get_active_model(req_p)
        configured = settings.is_provider_configured(req_p)

        return {
            "provider": req_p,
            "model": model,
            "configured": configured,
            "supported_providers": sorted(list(self.ALLOWED_PROVIDERS))
        }

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        fallback_response: Dict[str, Any],
        temperature: float = 0.2,
        provider: Optional[str] = None,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Routes the structured JSON generation request to the configured or requested provider.
        Tracks provider audit metadata (requested_provider, actual_provider, fallback_used).
        """
        requested_provider = (provider or settings.get_active_provider()).lower().strip()
        
        # Security validation against arbitrary provider names
        if requested_provider not in self.ALLOWED_PROVIDERS:
            logger.warning(f"Unsupported AI provider '{requested_provider}' requested. Falling back to default 'groq'.")
            actual_provider = "groq"
            fallback_used = True
        else:
            actual_provider = requested_provider
            fallback_used = False

        target_model = model or settings.get_active_model(actual_provider)

        # Check provider configuration
        if not settings.is_provider_configured(actual_provider):
            # If requested provider is not configured, attempt fallback to alternate configured provider if available
            alt_provider = "gemini" if actual_provider == "groq" else "groq"
            if settings.is_provider_configured(alt_provider):
                logger.info(f"Primary provider '{actual_provider}' not configured. Auto-falling back to configured '{alt_provider}'.")
                actual_provider = alt_provider
                target_model = settings.get_active_model(actual_provider)
                fallback_used = True

        logger.info(
            f"AI Reasoning Request -> requested_provider: '{requested_provider}', "
            f"actual_provider: '{actual_provider}', model: '{target_model}', fallback_used: {fallback_used}"
        )

        # Attach provider audit metadata to the fallback response so audit logs capture execution provider
        enriched_fallback = dict(fallback_response)
        enriched_fallback["_ai_metadata"] = {
            "requested_provider": requested_provider,
            "actual_provider": actual_provider,
            "model": target_model,
            "fallback_used": fallback_used
        }

        try:
            if actual_provider == "gemini":
                result = await gemini_service.generate_json(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    fallback_response=enriched_fallback,
                    temperature=temperature,
                    model=target_model
                )
            else:
                result = await groq_service.generate_json(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    fallback_response=enriched_fallback,
                    temperature=temperature,
                    model=target_model
                )

            # Ensure metadata is present in result if parsed successfully from LLM
            if isinstance(result, dict) and "_ai_metadata" not in result:
                result["_ai_metadata"] = {
                    "requested_provider": requested_provider,
                    "actual_provider": actual_provider,
                    "model": target_model,
                    "fallback_used": fallback_used
                }

            return result

        except Exception as err:
            logger.error(f"Error executing AI provider '{actual_provider}': {err}. Returning fallback response.")
            return enriched_fallback

ai_service = AIService()
