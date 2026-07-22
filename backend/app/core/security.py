import jwt

from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from app.core.config import ALGORITHM, SECRET_KEY
from app.db.session import get_db
from app.db.models import User
from app.services import user_service

security = HTTPBearer()


def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    if not SECRET_KEY:
        raise RuntimeError("SECRET_KEY no está configurada")
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    if not SECRET_KEY:
        raise HTTPException(status_code=401, detail="Token inválido")
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido")


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    payload = decode_token(credentials.credentials)
    subject = payload.get("sub")
    if not subject:
        raise HTTPException(status_code=401, detail="Token inválido")
    return str(subject)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials)
    subject = payload.get("sub")
    if not subject:
        raise HTTPException(status_code=401, detail="Token inválido")

    user = user_service.get_user_by_login(db, str(subject))
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuario no autorizado")
    return user


def require_roles(*role_names: str):
    allowed = {name for name in role_names}

    def _dependency(user: User = Depends(get_current_user)) -> User:
        role_name = user.role.name if user.role else None
        if allowed and role_name not in allowed:
            raise HTTPException(status_code=403, detail="No tienes permisos para esta acción")
        return user

    return _dependency
