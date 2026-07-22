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
            {"method": "GET", "path": "/api/auth/me", "description": "Perfil del administrador"},
            {"method": "PUT", "path": "/api/auth/profile", "description": "Actualizar perfil"},
            {"method": "POST", "path": "/api/auth/avatar", "description": "Subir foto de perfil"},
            {"method": "POST", "path": "/api/detect", "description": "Detección de antracnosis"},
            {"method": "GET", "path": "/api/admin/stats", "description": "Estadísticas"},
            {"method": "GET", "path": "/api/admin/detections", "description": "Historial de detecciones"},
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
    from app.db.session import check_database_connection

    database_url = config.DATABASE_URL
    meta = config.parse_database_url(database_url)

    if not database_url:
        return {
            "status": "disconnected",
            "label": "Sin base de datos",
            "connected": False,
            "engine": None,
            "host": None,
            "port": None,
            "database": None,
            "detail": "No hay DATABASE_URL configurada.",
            "storage_mode": "disconnected",
        }

    connected, error = check_database_connection()
    if connected:
        return {
            "status": "operational",
            "label": "Conectada",
            "connected": True,
            "engine": meta["engine"],
            "host": meta["host"],
            "port": meta["port"],
            "database": meta["database"],
            "url_masked": meta["masked"],
            "detail": "PostgreSQL operativo. Usuarios, roles y detecciones persistidos.",
            "storage_mode": "postgresql",
        }

    return {
        "status": "error",
        "label": "Error de conexión",
        "connected": False,
        "engine": meta["engine"],
        "host": meta["host"],
        "port": meta["port"],
        "database": meta["database"],
        "url_masked": meta["masked"],
        "detail": f"No se pudo conectar a la base de datos: {error}",
        "storage_mode": "error",
    }


def get_system_status() -> dict:
    api = _get_api_status()
    model = _get_model_status()
    database = _get_database_status()

    if api["status"] == "operational" and model["status"] == "operational" and database["status"] == "operational":
        overall = "operational"
        overall_label = "Todo operativo"
    elif api["status"] == "operational" and model["status"] == "operational":
        overall = "degraded"
        overall_label = "Operativo con limitaciones"
        if database["status"] == "disconnected":
            overall_label = "Operativo sin base de datos"
        elif database["status"] == "error":
            overall_label = "Operativo con error de base de datos"
    else:
        overall = "error"
        overall_label = "Con incidencias"

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
