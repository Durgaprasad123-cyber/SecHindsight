import json
import logging
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("sec_hindsight.groq")

class GroqService:
    """
    Groq LLM Service providing high-speed inference with structured JSON outputs.
    Includes built-in resilience, timeout handling, and security auditing.
    """
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL or "openai/gpt-oss-120b"
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        fallback_response: Dict[str, Any],
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        """
        Calls Groq API requesting JSON output.
        Logs errors cleanly without exposing secrets.
        """
        if not self.api_key or self.api_key.strip() == "":
            logger.info("Groq API key not configured. Using fallback response.")
            return fallback_response

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        # Groq JSON mode requires the word 'json' in system/user messages
        system_content = system_prompt
        if "json" not in system_content.lower():
            system_content += "\nIMPORTANT: Respond ONLY with valid JSON format."

        payload = {
            "model": settings.GROQ_MODEL or self.model,
            "messages": [
                {"role": "system", "content": system_content},
                {"role": "user", "content": user_prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": temperature,
            "max_tokens": 2048
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(self.base_url, headers=headers, json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    try:
                        return json.loads(content)
                    except json.JSONDecodeError as err:
                        logger.warning(f"Groq response JSON decode error: {err}. Output snippet: {content[:100]}")
                        return fallback_response
                else:
                    # Log error safely without exposing Authorization header or API key
                    logger.error(f"Groq API returned HTTP {response.status_code}: {response.text[:200]}")
                    return fallback_response
        except httpx.TimeoutException:
            logger.error(f"Groq API request timed out after 20 seconds.")
            return fallback_response
        except Exception as e:
            logger.error(f"Groq API call error: {type(e).__name__}")
            return fallback_response

groq_service = GroqService()
