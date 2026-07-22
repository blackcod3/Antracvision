from __future__ import annotations

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload
from app.core.security_passwords import hash_password, verify_password
from app.db.models import User
from fastapi import HTTPException


def public_profile(user: User) -> dict:
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "username": user.username,
        "avatar_url": user.avatar_url,
        "role": user.role.name if user.role else "Administrador",
        "is_active": user.is_active,
    }


def get_user_by_login(db: Session, identifier: str) -> User | None:
    cleaned = identifier.strip().lower()
    if not cleaned:
        return None
    return db.scalar(
        select(User)
        .options(joinedload(User.role))
        .where(
            or_(
                User.email == cleaned,
                User.username == cleaned,
            )
        )
    )


def authenticate_user(db: Session, identifier: str, password: str) -> User | None:
    user = get_user_by_login(db, identifier)
    if user is None or not user.is_active:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def update_user_profile(
    db: Session,
    user: User,
    *,
    full_name: str | None = None,
    email: str | None = None,
    current_password: str | None = None,
    new_password: str | None = None,
) -> User:
    changing_sensitive = bool(email is not None and email.strip().lower() != user.email.lower()) or bool(
        new_password
    )

    if changing_sensitive:
        if not current_password or not verify_password(current_password, user.password_hash):
            raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")

    if full_name is not None:
        name = full_name.strip()
        if len(name) < 2:
            raise HTTPException(status_code=400, detail="El nombre debe tener al menos 2 caracteres")
        user.full_name = name

    if email is not None:
        cleaned = email.strip().lower()
        if "@" not in cleaned or "." not in cleaned.split("@")[-1]:
            raise HTTPException(status_code=400, detail="Correo electrónico inválido")
        existing = db.scalar(select(User).where(User.email == cleaned, User.id != user.id))
        if existing:
            raise HTTPException(status_code=400, detail="El correo ya está en uso")
        user.email = cleaned
        user.username = cleaned

    if new_password:
        if len(new_password) < 8:
            raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 8 caracteres")
        user.password_hash = hash_password(new_password)

    db.add(user)
    db.commit()
    db.refresh(user)
    return user
