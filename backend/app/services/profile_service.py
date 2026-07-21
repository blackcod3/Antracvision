import json
import uuid
from pathlib import Path
from typing import Any
from fastapi import UploadFile, HTTPException
from app.core import config

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
PROFILE_PATH = DATA_DIR / "admin_profile.json"
UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "avatars"
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_AVATAR_BYTES = 5 * 1024 * 1024


def _default_profile() -> dict[str, Any]:
    username = config.ADMIN_USERNAME or "admin"
    return {
        "full_name": "Administrador",
        "email": username if "@" in username else f"{username}@antracvision.com",
        "username": username,
        "password": config.ADMIN_PASSWORD or "",
        "avatar_url": None,
        "role": "Administrador",
    }


def _ensure_dirs() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def load_profile() -> dict[str, Any]:
    _ensure_dirs()
    defaults = _default_profile()
    if not PROFILE_PATH.exists():
        return defaults.copy()

    try:
        with PROFILE_PATH.open("r", encoding="utf-8") as fh:
            stored = json.load(fh)
    except (json.JSONDecodeError, OSError):
        return defaults.copy()

    merged = defaults.copy()
    merged.update({k: v for k, v in stored.items() if v is not None})
    if not merged.get("password"):
        merged["password"] = defaults["password"]
    return merged


def save_profile(profile: dict[str, Any]) -> dict[str, Any]:
    _ensure_dirs()
    to_store = {
        "full_name": profile.get("full_name"),
        "email": profile.get("email"),
        "username": profile.get("username"),
        "password": profile.get("password"),
        "avatar_url": profile.get("avatar_url"),
        "role": profile.get("role", "Administrador"),
    }
    with PROFILE_PATH.open("w", encoding="utf-8") as fh:
        json.dump(to_store, fh, ensure_ascii=False, indent=2)
    return public_profile(to_store)


def public_profile(profile: dict[str, Any] | None = None) -> dict[str, Any]:
    data = profile or load_profile()
    return {
        "full_name": data.get("full_name") or "Administrador",
        "email": data.get("email") or "",
        "username": data.get("username") or "",
        "avatar_url": data.get("avatar_url"),
        "role": data.get("role") or "Administrador",
    }


def get_login_identifier(profile: dict[str, Any] | None = None) -> str:
    data = profile or load_profile()
    return (data.get("email") or data.get("username") or config.ADMIN_USERNAME or "").strip()


def verify_credentials(identifier: str, password: str) -> bool:
    profile = load_profile()
    login_id = get_login_identifier(profile)
    stored_password = profile.get("password") or ""
    candidates = {
        login_id.lower(),
        (profile.get("username") or "").lower(),
        (config.ADMIN_USERNAME or "").lower(),
    }
    candidates.discard("")
    return identifier.strip().lower() in candidates and password == stored_password


def update_profile(
    *,
    full_name: str | None = None,
    email: str | None = None,
    current_password: str | None = None,
    new_password: str | None = None,
) -> dict[str, Any]:
    profile = load_profile()

    changing_sensitive = bool(email is not None and email.strip() != profile.get("email")) or bool(
        new_password
    )

    if changing_sensitive:
        if not current_password or current_password != profile.get("password"):
            raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")

    if full_name is not None:
        name = full_name.strip()
        if len(name) < 2:
            raise HTTPException(status_code=400, detail="El nombre debe tener al menos 2 caracteres")
        profile["full_name"] = name

    if email is not None:
        cleaned = email.strip().lower()
        if "@" not in cleaned or "." not in cleaned.split("@")[-1]:
            raise HTTPException(status_code=400, detail="Correo electrónico inválido")
        profile["email"] = cleaned
        profile["username"] = cleaned

    if new_password:
        if len(new_password) < 8:
            raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 8 caracteres")
        profile["password"] = new_password

    return save_profile(profile)


async def save_avatar(file: UploadFile) -> dict[str, Any]:
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Formato de imagen no permitido. Usa JPG, PNG, WEBP o GIF.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Archivo vacío")
    if len(content) > MAX_AVATAR_BYTES:
        raise HTTPException(status_code=400, detail="La imagen no puede superar 5 MB")

    _ensure_dirs()
    ext = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }[file.content_type]

    profile = load_profile()
    old_url = profile.get("avatar_url")
    filename = f"admin-{uuid.uuid4().hex[:12]}{ext}"
    dest = UPLOADS_DIR / filename
    dest.write_bytes(content)

    if old_url and old_url.startswith("/uploads/avatars/"):
        old_path = UPLOADS_DIR / Path(old_url).name
        if old_path.exists() and old_path != dest:
            try:
                old_path.unlink()
            except OSError:
                pass

    profile["avatar_url"] = f"/uploads/avatars/{filename}"
    return save_profile(profile)


def remove_avatar() -> dict[str, Any]:
    profile = load_profile()
    old_url = profile.get("avatar_url")
    if old_url and old_url.startswith("/uploads/avatars/"):
        old_path = UPLOADS_DIR / Path(old_url).name
        if old_path.exists():
            try:
                old_path.unlink()
            except OSError:
                pass
    profile["avatar_url"] = None
    return save_profile(profile)
