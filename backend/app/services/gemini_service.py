import json
import logging
import re
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("sec_hindsight.gemini")

class GeminiService:
    """
    Google Gemini AI Service providing reasoning with structured JSON outputs
    using the official Google GenAI SDK (`google-genai`).
    Includes built-in resilience, error handling, and security auditing.
    """
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL or "gemini-2.5-flash"

    def _clean_json_text(self, text: str) -> str:
        """Strips markdown fences if present in model output."""
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(r"\n?```$", "", cleaned)
        return cleaned.strip()

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        fallback_response: Dict[str, Any],
        temperature: float = 0.2,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calls Google Gemini API via official google-genai SDK requesting JSON output.
        Logs errors cleanly without exposing secrets.
        """
        api_key = settings.GEMINI_API_KEY or self.api_key
        if not api_key or api_key.strip() == "":
            logger.info("Gemini API key not configured. Using fallback response.")
            return fallback_response

        target_model = model or settings.GEMINI_MODEL or self.model

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)

            system_content = system_prompt
            if "json" not in system_content.lower():
                system_content += "\nIMPORTANT: Respond ONLY with valid JSON format."

            config = types.GenerateContentConfig(
                system_instruction=system_content,
                response_mime_type="application/json",
                temperature=temperature,
            )

            # Use async client interface (client.aio)
            response = await client.aio.models.generate_content(
                model=target_model,
                contents=user_prompt,
                config=config
            )

            if response and response.text:
                raw_text = self._clean_json_text(response.text)
                try:
                    return json.loads(raw_text)
                except json.JSONDecodeError as err:
                    logger.warning(f"Gemini response JSON decode error: {err}. Output snippet: {raw_text[:100]}")
                    return fallback_response
            else:
                logger.warning("Gemini API returned an empty or invalid response object.")
                return fallback_response

        except Exception as e:
            logger.error(f"Gemini API call error ({type(e).__name__}): {str(e)[:200]}")
            return fallback_response

gemini_service = GeminiService()
