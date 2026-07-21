import os
import platform
import time
from pathlib import Path

from app.core import config

_STARTED_AT = time.time()


def _format_bytes(num: int) -> str:
    units = ["B", "KB", "MB", "GB"]
    size = float(num)
    for unit in units:
        if size < 1024 or unit == units[-1]:
            return f"{size:.1f} {unit}" if unit != "B" else f"{int(size)} {unit}"
        size /= 1024
    return f"{num} B"


def _get_api_status() -> dict:
    return {
        "status": "operational",
        "label": "Operativo",
        "name": config.APP_NAME,
        "version": config.APP_VERSION,
        "framework": "FastAPI",
        "uptime_seconds": int(time.time() - _STARTED_AT),
        "frontend_url": config.FRONTEND_URL,
        "cors": "enabled",
        "auth": "JWT Bearer",
        "token_expire_minutes": config.ACCESS_TOKEN_EXPIRE_MINUTES,
        "endpoints": [
            {"method": "GET", "path": "/api/health", "description": "Health check"},
            {"method": "POST", "path": "/api/auth/login", "description": "Autenticación admin"},
            {"method": "POST", "path": "/api/detect", "description": "Detección de antracnosis"},
            {"method": "GET", "path": "/api/admin/stats", "description": "Estadísticas"},
            {"method": "GET", "path": "/api/admin/system-status", "description": "Estado del sistema"},
        ],
        "runtime": {
            "python": platform.python_version(),
            "system": platform.system(),
            "machine": platform.machine(),
        },
    }


def _get_model_status() -> dict:
    from app.core.model_loader import MODEL_PATH, model

    path = Path(MODEL_PATH)
    exists = path.exists()
    size_bytes = path.stat().st_size if exists else 0

    try:
        names = getattr(model, "names", None) or {}
        if isinstance(names, dict):
            classes = [str(v) for _, v in sorted(names.items(), key=lambda x: int(x[0]) if str(x[0]).isdigit() else 0)]
        else:
            classes = [str(n) for n in names]

        task = getattr(model, "task", "classify")
        device = str(getattr(getattr(model, "device", None), "type", None) or getattr(model, "device", "cpu"))
        loaded = True
        detail = "Modelo cargado en memoria y listo para inferencia"
    except Exception as exc:
        classes = []
        task = "unknown"
        device = "unknown"
        loaded = False
        detail = f"Error al inspeccionar el modelo: {exc}"

    return {
        "status": "operational" if loaded and exists else "error",
        "label": "Cargado" if loaded and exists else "Error",
        "name": "YOLOv8 Classification",
        "file": path.name,
        "path": str(path.resolve()) if exists else str(path),
        "exists": exists,
        "loaded": loaded,
        "size": _format_bytes(size_bytes) if exists else None,
        "size_bytes": size_bytes if exists else 0,
        "task": task,
        "device": device,
        "input_size": "224x224",
        "classes": classes or ["Antracnosis", "Sana"],
        "framework": "Ultralytics",
        "detail": detail,
    }


def _get_database_status() -> dict:
    database_url = config.DATABASE_URL

    if not database_url:
        return {
            "status": "disconnected",
            "label": "Sin base de datos",
            "connected": False,
            "engine": None,
            "host": None,
            "database": None,
            "detail": "No hay DATABASE_URL configurada. Las estadísticas se mantienen en memoria y se reinician al reiniciar el servidor.",
            "storage_mode": "in_memory",
        }

    # Future: probe real DB when DATABASE_URL is configured
    masked = database_url
    if "@" in database_url:
        scheme, rest = database_url.split("://", 1) if "://" in database_url else ("", database_url)
        user_host = rest.split("@", 1)[-1]
        masked = f"{scheme}://***@{user_host}" if scheme else f"***@{user_host}"

    engine = database_url.split("://", 1)[0] if "://" in database_url else "unknown"

    return {
        "status": "configured",
        "label": "Configurada",
        "connected": False,
        "engine": engine,
        "url_masked": masked,
        "host": None,
        "database": None,
        "detail": "DATABASE_URL está definida, pero la integración de persistencia aún no está activa.",
        "storage_mode": "configured_pending",
    }


def get_system_status() -> dict:
    api = _get_api_status()
    model = _get_model_status()
    database = _get_database_status()

    components = [api["status"], model["status"], database["status"]]
    if all(s in ("operational", "configured") for s in components) and database["status"] == "operational":
        overall = "operational"
        overall_label = "Todo operativo"
    elif api["status"] == "operational" and model["status"] == "operational":
        overall = "degraded"
        overall_label = "Operativo con limitaciones"
    else:
        overall = "error"
        overall_label = "Con incidencias"

    # Without DB, degraded is expected and OK
    if api["status"] == "operational" and model["status"] == "operational" and database["status"] == "disconnected":
        overall = "degraded"
        overall_label = "Operativo sin base de datos"

    return {
        "overall": {
            "status": overall,
            "label": overall_label,
            "checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        },
        "api": api,
        "model": model,
        "database": database,
    }
