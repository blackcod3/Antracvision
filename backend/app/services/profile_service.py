from __future__ import annotations

import uuid
from pathlib import Path
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.db.models import User
from app.services import user_service

UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "avatars"
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_AVATAR_BYTES = 5 * 1024 * 1024


def _ensure_dirs() -> None:
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def public_profile(user: User) -> dict:
    return user_service.public_profile(user)


def update_profile(
    db: Session,
    user: User,
    *,
    full_name: str | None = None,
    email: str | None = None,
    current_password: str | None = None,
    new_password: str | None = None,
) -> dict:
    updated = user_service.update_user_profile(
        db,
        user,
        full_name=full_name,
        email=email,
        current_password=current_password,
        new_password=new_password,
    )
    return public_profile(updated)


async def save_avatar(db: Session, user: User, file: UploadFile) -> dict:
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

    old_url = user.avatar_url
    filename = f"user-{user.id}-{uuid.uuid4().hex[:12]}{ext}"
    dest = UPLOADS_DIR / filename
    dest.write_bytes(content)

    if old_url and old_url.startswith("/uploads/avatars/"):
        old_path = UPLOADS_DIR / Path(old_url).name
        if old_path.exists() and old_path != dest:
            try:
                old_path.unlink()
            except OSError:
                pass

    user.avatar_url = f"/uploads/avatars/{filename}"
    db.add(user)
    db.commit()
    db.refresh(user)
    return public_profile(user)


def remove_avatar(db: Session, user: User) -> dict:
    old_url = user.avatar_url
    if old_url and old_url.startswith("/uploads/avatars/"):
        old_path = UPLOADS_DIR / Path(old_url).name
        if old_path.exists():
            try:
                old_path.unlink()
            except OSError:
                pass
    user.avatar_url = None
    db.add(user)
    db.commit()
    db.refresh(user)
    return public_profile(user)
