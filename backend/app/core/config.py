from __future__ import annotations

import os

from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

APP_NAME = os.getenv("APP_NAME", "API Deteccion Antracnosis")
APP_VERSION = os.getenv("APP_VERSION", "1.0.0")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@antracvision.com")
ADMIN_FULL_NAME = os.getenv("ADMIN_FULL_NAME", "Administrador")

MODEL_PATH = os.getenv("MODEL_PATH", "app/models/yolov8_cls_best.pt")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

def _normalize_database_url(url: str) -> str:
    """Force SQLAlchemy to use psycopg3 (not psycopg2).

    Platforms like Railway inject postgres:// or postgresql:// URLs; without an
    explicit dialect SQLAlchemy defaults to psycopg2, which is not installed.
    """
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://") :]
    if url.startswith("postgresql+psycopg2://"):
        return "postgresql+psycopg://" + url[len("postgresql+psycopg2://") :]
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url[len("postgresql://") :]
    return url


DATABASE_URL = _normalize_database_url(
    os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://antracvision:antracvision@127.0.0.1:5433/antracvision",
    )
)


def parse_database_url(url: str | None = None) -> dict:
    raw = url or DATABASE_URL or ""
    if not raw:
        return {
            "scheme": None,
            "host": None,
            "port": None,
            "database": None,
            "username": None,
            "masked": None,
            "engine": None,
        }

    # SQLAlchemy dialect prefixes like postgresql+psycopg://
    normalized = raw.replace("postgresql+psycopg://", "postgresql://", 1)
    normalized = normalized.replace("postgresql+psycopg2://", "postgresql://", 1)
    parsed = urlparse(normalized)
    scheme = raw.split("://", 1)[0] if "://" in raw else "postgresql"
    host = parsed.hostname
    port = parsed.port
    database = (parsed.path or "").lstrip("/") or None
    username = parsed.username
    host_part = host or ""
    if port:
        host_part = f"{host_part}:{port}"
    masked = f"{scheme}://***@{host_part}/{database or ''}" if host_part else scheme
    return {
        "scheme": scheme,
        "host": host,
        "port": port,
        "database": database,
        "username": username,
        "masked": masked,
        "engine": "PostgreSQL" if "postgresql" in scheme else scheme,
    }
