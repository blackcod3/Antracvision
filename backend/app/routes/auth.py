from datetime import timedelta

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from app.core.security import create_access_token, get_current_user
from app.db.models import User
from app.db.session import get_db
from app.schemas.auth_schema import LoginRequest, ProfileUpdateRequest
from app.services import profile_service, user_service

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/login")
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = user_service.authenticate_user(db, credentials.username, credentials.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    token = create_access_token(
        data={
            "sub": user.email,
            "uid": user.id,
            "role": user.role.name if user.role else None,
        },
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "profile": user_service.public_profile(user),
    }


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return user_service.public_profile(user)


@router.put("/profile")
async def update_profile(
    payload: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return profile_service.update_profile(
        db,
        user,
        full_name=payload.full_name,
        email=payload.email,
        current_password=payload.current_password,
        new_password=payload.new_password,
    )


@router.post("/avatar")
async def upload_avatar(
    avatar: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await profile_service.save_avatar(db, user, avatar)


@router.delete("/avatar")
async def delete_avatar(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return profile_service.remove_avatar(db, user)
