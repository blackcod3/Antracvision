from __future__ import annotations

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload
from app.core.security_passwords import hash_password, verify_password
from app.db.models import Role, User
from app.db.seed import DEFAULT_ROLES, ROLE_ADMIN
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


def get_user_by_id(db: Session, user_id: int) -> User:
    user = db.scalar(
        select(User).options(joinedload(User.role)).where(User.id == user_id)
    )
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


def _get_role(db: Session, role_name: str) -> Role:
    role = db.scalar(select(Role).where(Role.name == role_name.strip()))
    if role is None:
        raise HTTPException(status_code=400, detail="Rol inválido")
    return role


def _validate_identity(full_name: str, email: str, username: str) -> tuple[str, str, str]:
    name = full_name.strip()
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="El nombre debe tener al menos 2 caracteres")

    cleaned_email = email.strip().lower()
    if "@" not in cleaned_email or "." not in cleaned_email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Correo electrónico inválido")

    cleaned_username = username.strip().lower()
    if len(cleaned_username) < 3:
        raise HTTPException(status_code=400, detail="El usuario debe tener al menos 3 caracteres")

    return name, cleaned_email, cleaned_username


def _count_active_admins(db: Session, *, exclude_user_id: int | None = None) -> int:
    query = (
        select(User)
        .join(Role)
        .where(Role.name == ROLE_ADMIN, User.is_active.is_(True))
    )
    if exclude_user_id is not None:
        query = query.where(User.id != exclude_user_id)
    return len(db.scalars(query).all())


def _ensure_not_last_active_admin(db: Session, user: User) -> None:
    role_name = user.role.name if user.role else None
    if role_name != ROLE_ADMIN or not user.is_active:
        return
    if _count_active_admins(db, exclude_user_id=user.id) == 0:
        raise HTTPException(
            status_code=400,
            detail="No se puede dejar el sistema sin un administrador activo",
        )


def list_roles(db: Session) -> list[dict]:
    roles = db.scalars(select(Role).order_by(Role.id.asc())).all()
    descriptions = {name: description for name, description in DEFAULT_ROLES}
    return [
        {
            "id": role.id,
            "name": role.name,
            "description": role.description or descriptions.get(role.name),
        }
        for role in roles
    ]


def list_users(db: Session) -> list[dict]:
    users = db.scalars(
        select(User).options(joinedload(User.role)).order_by(User.id.asc())
    ).unique().all()
    return [public_profile(user) for user in users]


def create_user(
    db: Session,
    *,
    full_name: str,
    email: str,
    username: str,
    password: str,
    role_name: str,
) -> User:
    name, cleaned_email, cleaned_username = _validate_identity(full_name, email, username)

    if len(password) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")

    role = _get_role(db, role_name)

    existing_email = db.scalar(select(User).where(User.email == cleaned_email))
    if existing_email:
        raise HTTPException(status_code=400, detail="El correo ya está en uso")

    existing_username = db.scalar(select(User).where(User.username == cleaned_username))
    if existing_username:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso")

    user = User(
        full_name=name,
        email=cleaned_email,
        username=cleaned_username,
        password_hash=hash_password(password),
        role_id=role.id,
        is_active=True,
    )
    db.add(user)
    db.commit()
    return get_user_by_id(db, user.id)


def update_managed_user(
    db: Session,
    user_id: int,
    *,
    full_name: str,
    email: str,
    username: str,
    role_name: str,
    password: str | None = None,
    actor: User,
) -> User:
    user = get_user_by_id(db, user_id)
    name, cleaned_email, cleaned_username = _validate_identity(full_name, email, username)
    role = _get_role(db, role_name)

    existing_email = db.scalar(
        select(User).where(User.email == cleaned_email, User.id != user.id)
    )
    if existing_email:
        raise HTTPException(status_code=400, detail="El correo ya está en uso")

    existing_username = db.scalar(
        select(User).where(User.username == cleaned_username, User.id != user.id)
    )
    if existing_username:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso")

    current_role = user.role.name if user.role else None
    demoting_self_admin = (
        actor.id == user.id
        and current_role == ROLE_ADMIN
        and role.name != ROLE_ADMIN
        and user.is_active
    )
    if demoting_self_admin and _count_active_admins(db, exclude_user_id=user.id) == 0:
        raise HTTPException(
            status_code=400,
            detail="No puedes quitarte el rol de administrador si eres el único activo",
        )

    if password:
        if len(password) < 8:
            raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")
        user.password_hash = hash_password(password)

    user.full_name = name
    user.email = cleaned_email
    user.username = cleaned_username
    user.role_id = role.id
    db.add(user)
    db.commit()
    return get_user_by_id(db, user.id)


def set_user_active(db: Session, user_id: int, *, is_active: bool, actor: User) -> User:
    user = get_user_by_id(db, user_id)
    if actor.id == user.id:
        raise HTTPException(status_code=400, detail="No puedes cambiar el estado de tu propia cuenta")

    if not is_active:
        _ensure_not_last_active_admin(db, user)

    user.is_active = is_active
    db.add(user)
    db.commit()
    return get_user_by_id(db, user.id)


def delete_user(db: Session, user_id: int, *, actor: User) -> None:
    user = get_user_by_id(db, user_id)
    if actor.id == user.id:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propia cuenta")

    _ensure_not_last_active_admin(db, user)
    db.delete(user)
    db.commit()


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
