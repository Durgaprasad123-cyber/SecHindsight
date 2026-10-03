import os
from typing import List, Union
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "SecHindsight API"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Groq Configuration
    GROQ_API_KEY: str = Field(default="")
    GROQ_MODEL: str = Field(default="openai/gpt-oss-120b")

    # Gemini Configuration
    GEMINI_API_KEY: str = Field(default="")
    GEMINI_MODEL: str = Field(default="gemini-2.5-flash")

    # AI Provider Selection ("groq" or "gemini")
    AI_PROVIDER: str = Field(default="groq")

    # Hindsight Cloud API Configuration
    HINDSIGHT_API_KEY: str = Field(default="")
    HINDSIGHT_BASE_URL: str = Field(default="https://api.hindsight.vectorize.io")
    HINDSIGHT_API_URL: str = Field(default="")
    HINDSIGHT_BANK_ID: str = Field(default="sechindsight")

    # Supabase / PostgreSQL Configuration
    SUPABASE_URL: str = Field(default="")
    SUPABASE_SECRET_KEY: str = Field(default="")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="")
    SUPABASE_PUBLISHABLE_KEY: str = Field(default="")
    SUPABASE_ANON_KEY: str = Field(default="")
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///./sec_hindsight.db")

    # CORS Origins
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def get_cors_origins(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    def get_effective_hindsight_url(self) -> str:
        if self.HINDSIGHT_BASE_URL and self.HINDSIGHT_BASE_URL.strip():
            return self.HINDSIGHT_BASE_URL.rstrip('/')
        if self.HINDSIGHT_API_URL and self.HINDSIGHT_API_URL.strip():
            return self.HINDSIGHT_API_URL.rstrip('/')
        return "https://api.hindsight.vectorize.io"

    def get_effective_supabase_secret(self) -> str:
        return self.SUPABASE_SECRET_KEY or self.SUPABASE_SERVICE_ROLE_KEY or ""

    def get_effective_supabase_publishable(self) -> str:
        return self.SUPABASE_PUBLISHABLE_KEY or self.SUPABASE_ANON_KEY or ""

    def is_groq_configured(self) -> bool:
        return bool(self.GROQ_API_KEY and self.GROQ_API_KEY.strip() != "")

    def is_gemini_configured(self) -> bool:
        return bool(self.GEMINI_API_KEY and self.GEMINI_API_KEY.strip() != "")

    def is_provider_configured(self, provider: str = None) -> bool:
        p = (provider or self.get_active_provider()).lower().strip()
        if p == "gemini":
            return self.is_gemini_configured()
        return self.is_groq_configured()

    def get_active_provider(self) -> str:
        p = (self.AI_PROVIDER or "groq").lower().strip()
        if p in ["groq", "gemini"]:
            return p
        return "groq"

    def get_active_model(self, provider: str = None) -> str:
        p = (provider or self.get_active_provider()).lower().strip()
        if p == "gemini":
            return self.GEMINI_MODEL or "gemini-2.5-flash"
        return self.GROQ_MODEL or "openai/gpt-oss-120b"

    def is_hindsight_configured(self) -> bool:
        return bool(self.HINDSIGHT_API_KEY and self.HINDSIGHT_API_KEY.strip() != "")

    def is_supabase_configured(self) -> bool:
        return bool(self.SUPABASE_URL and self.SUPABASE_URL.strip() != "" and self.get_effective_supabase_secret() != "")

settings = Settings()

