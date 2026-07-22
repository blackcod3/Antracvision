from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.security import require_roles
from app.db.models import User
from app.db.session import get_db
from app.db.seed import ROLE_ADMIN, ROLE_OPERATOR
from app.schemas.user_schema import CreateUserRequest, SetUserActiveRequest, UpdateUserRequest
from app.services import user_service
from app.services.stats_service import get_recent_detections, get_stats, soft_delete_detection
from app.services.system_status_service import get_system_status

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/stats")
async def stats(
    _: User = Depends(require_roles(ROLE_ADMIN, ROLE_OPERATOR)),
    db: Session = Depends(get_db),
):
    return get_stats(db)


@router.get("/detections")
async def detections(
    limit: int = 100,
    _: User = Depends(require_roles(ROLE_ADMIN, ROLE_OPERATOR)),
    db: Session = Depends(get_db),
):
    capped = max(1, min(limit, 200))
    return {"detections": get_recent_detections(capped, db=db)}


@router.delete("/detections/{detection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_detection(
    detection_id: int,
    _: User = Depends(require_roles(ROLE_ADMIN, ROLE_OPERATOR)),
    db: Session = Depends(get_db),
):
    soft_delete_detection(db, detection_id)


@router.get("/system-status")
async def system_status(_: User = Depends(require_roles(ROLE_ADMIN))):
    return get_system_status()


@router.get("/roles")
async def roles(
    _: User = Depends(require_roles(ROLE_ADMIN)),
    db: Session = Depends(get_db),
):
    return {"roles": user_service.list_roles(db)}


@router.get("/users")
async def users(
    _: User = Depends(require_roles(ROLE_ADMIN)),
    db: Session = Depends(get_db),
):
    return {"users": user_service.list_users(db)}


@router.get("/users/{user_id}")
async def get_user(
    user_id: int,
    _: User = Depends(require_roles(ROLE_ADMIN)),
    db: Session = Depends(get_db),
):
    return user_service.public_profile(user_service.get_user_by_id(db, user_id))


@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: CreateUserRequest,
    _: User = Depends(require_roles(ROLE_ADMIN)),
    db: Session = Depends(get_db),
):
    user = user_service.create_user(
        db,
        full_name=payload.full_name,
        email=payload.email,
        username=payload.username,
        password=payload.password,
        role_name=payload.role,
    )
    return user_service.public_profile(user)


@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    payload: UpdateUserRequest,
    actor: User = Depends(require_roles(ROLE_ADMIN)),
    db: Session = Depends(get_db),
):
    user = user_service.update_managed_user(
        db,
        user_id,
        full_name=payload.full_name,
        email=payload.email,
        username=payload.username,
        role_name=payload.role,
        password=payload.password,
        actor=actor,
    )
    return user_service.public_profile(user)


@router.patch("/users/{user_id}/active")
async def set_user_active(
    user_id: int,
    payload: SetUserActiveRequest,
    actor: User = Depends(require_roles(ROLE_ADMIN)),
    db: Session = Depends(get_db),
):
    user = user_service.set_user_active(
        db,
        user_id,
        is_active=payload.is_active,
        actor=actor,
    )
    return user_service.public_profile(user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    actor: User = Depends(require_roles(ROLE_ADMIN)),
    db: Session = Depends(get_db),
):
    user_service.delete_user(db, user_id, actor=actor)
