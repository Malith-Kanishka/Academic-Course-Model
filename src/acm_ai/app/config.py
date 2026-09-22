"""
Shared configuration for the Agentic AI subsystem.

Loads from environment variables (and a local .env file via python-dotenv,
same pattern the team already used for the Socratic Adversary agent's Groq
integration on main). Do not hardcode secrets here - .env is gitignored.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # --- LLM (Groq / Llama 3) ---
    # Matches the team's existing Groq setup (see socratic_adversary_agent.py on main).
    GROQ_API_KEY: str | None = os.getenv("GROQ_API_KEY")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama3-8b-8192")
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.3"))
    LLM_TIMEOUT_SECONDS: float = float(os.getenv("LLM_TIMEOUT_SECONDS", "8.0"))
    LLM_MAX_RETRIES: int = int(os.getenv("LLM_MAX_RETRIES", "2"))

    # --- Database (direct Postgres/Supabase connection for agent tools) ---
    DATABASE_URL: str | None = os.getenv("DATABASE_URL")

    # --- Service ---
    APP_ENV: str = os.getenv("APP_ENV", "development")


settings = Settings()
