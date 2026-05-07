from fastapi import APIRouter, HTTPException
from datetime import timedelta

from app.schemas.auth_schema import LoginRequest
from app.core.security import create_access_token
from app.core.config import *

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/login")
async def login(credentials: LoginRequest):

    if credentials.username != ADMIN_USERNAME:
        raise HTTPException(status_code=401)

    if credentials.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401)

    token = create_access_token(
        data={"sub": credentials.username},
        expires_delta=timedelta(minutes=30)
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }