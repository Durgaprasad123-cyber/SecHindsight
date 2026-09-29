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
    GROQ_API_KEY: str = Field(default="", env="GROQ_API_KEY")
    GROQ_MODEL: str = Field(default="openai/gpt-oss-120b", env="GROQ_MODEL")

    # Hindsight Cloud API Configuration
    HINDSIGHT_API_KEY: str = Field(default="", env="HINDSIGHT_API_KEY")
    HINDSIGHT_BASE_URL: str = Field(default="https://api.hindsight.vectorize.io", env="HINDSIGHT_BASE_URL")
    HINDSIGHT_API_URL: str = Field(default="", env="HINDSIGHT_API_URL")
    HINDSIGHT_BANK_ID: str = Field(default="sechindsight", env="HINDSIGHT_BANK_ID")

    # Supabase / PostgreSQL Configuration
    SUPABASE_URL: str = Field(default="", env="SUPABASE_URL")
    SUPABASE_SECRET_KEY: str = Field(default="", env="SUPABASE_SECRET_KEY")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="", env="SUPABASE_SERVICE_ROLE_KEY")
    SUPABASE_PUBLISHABLE_KEY: str = Field(default="", env="SUPABASE_PUBLISHABLE_KEY")
    SUPABASE_ANON_KEY: str = Field(default="", env="SUPABASE_ANON_KEY")
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///./sec_hindsight.db", env="DATABASE_URL")

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

    def is_hindsight_configured(self) -> bool:
        return bool(self.HINDSIGHT_API_KEY and self.HINDSIGHT_API_KEY.strip() != "")

    def is_supabase_configured(self) -> bool:
        return bool(self.SUPABASE_URL and self.SUPABASE_URL.strip() != "" and self.get_effective_supabase_secret() != "")

settings = Settings()
