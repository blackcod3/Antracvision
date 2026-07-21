from datetime import timedelta

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.schemas.auth_schema import LoginRequest, ProfileUpdateRequest
from app.core.security import create_access_token, verify_token
from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from app.services import profile_service

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/login")
async def login(credentials: LoginRequest):
    if not profile_service.verify_credentials(credentials.username, credentials.password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    login_id = profile_service.get_login_identifier()
    token = create_access_token(
        data={"sub": login_id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "profile": profile_service.public_profile(),
    }


@router.get("/me")
async def me(_: str = Depends(verify_token)):
    return profile_service.public_profile()


@router.put("/profile")
async def update_profile(
    payload: ProfileUpdateRequest,
    _: str = Depends(verify_token),
):
    return profile_service.update_profile(
        full_name=payload.full_name,
        email=payload.email,
        current_password=payload.current_password,
        new_password=payload.new_password,
    )


@router.post("/avatar")
async def upload_avatar(
    avatar: UploadFile = File(...),
    _: str = Depends(verify_token),
):
    return await profile_service.save_avatar(avatar)


@router.delete("/avatar")
async def delete_avatar(_: str = Depends(verify_token)):
    return profile_service.remove_avatar()
