"""Seed roles and bootstrap admin user."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import config
from app.core.security_passwords import hash_password
from app.db.models import Role, User

ROLE_ADMIN = "Administrador"
ROLE_OPERATOR = "Operador"

DEFAULT_ROLES = (
    (ROLE_ADMIN, "Acceso completo al panel de administración"),
    (ROLE_OPERATOR, "Puede consultar detecciones y estadísticas"),
)


def ensure_roles(db: Session) -> dict[str, Role]:
    roles: dict[str, Role] = {}
    for name, description in DEFAULT_ROLES:
        role = db.scalar(select(Role).where(Role.name == name))
        if role is None:
            role = Role(name=name, description=description)
            db.add(role)
            db.flush()
        roles[name] = role
    return roles


def ensure_admin_user(db: Session, roles: dict[str, Role] | None = None) -> User:
    roles = roles or ensure_roles(db)
    admin_role = roles[ROLE_ADMIN]

    username = (config.ADMIN_USERNAME or "admin").strip()
    email = (config.ADMIN_EMAIL or f"{username}@antracvision.com").strip().lower()
    if "@" not in email:
        email = f"{username}@antracvision.com"

    user = db.scalar(
        select(User).where((User.username == username) | (User.email == email))
    )
    if user is None:
        user = User(
            full_name=config.ADMIN_FULL_NAME or "Administrador",
            email=email,
            username=username,
            password_hash=hash_password(config.ADMIN_PASSWORD or "admin123"),
            role_id=admin_role.id,
            is_active=True,
        )
        db.add(user)
        db.flush()
        return user

    # Keep bootstrap identity in sync with env on first deployments
    user.role_id = admin_role.id
    user.is_active = True
    if not user.full_name:
        user.full_name = config.ADMIN_FULL_NAME or "Administrador"
    return user


def seed_database(db: Session) -> None:
    roles = ensure_roles(db)
    ensure_admin_user(db, roles)
    db.commit()
