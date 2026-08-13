from fastapi import APIRouter, Depends, Request, status
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


@router.get("/openapi.json", include_in_schema=False)
async def openapi_spec(
    request: Request,
    _: User = Depends(require_roles(ROLE_ADMIN)),
):
    return request.app.openapi()


@router.get("/stats", summary="Estadísticas del dashboard")
async def stats(
    _: User = Depends(require_roles(ROLE_ADMIN, ROLE_OPERATOR)),
    db: Session = Depends(get_db),
):
    return get_stats(db)


@router.get("/detections", summary="Historial de detecciones")
async def detections(
    limit: int = 100,
    _: User = Depends(require_roles(ROLE_ADMIN, ROLE_OPERATOR)),
    db: Session = Depends(get_db),
):
    capped = max(1, min(limit, 200))
    return {"detections": get_recent_detections(capped, db=db)}


@router.delete("/detections/{detection_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar detección")
async def delete_detection(
    detection_id: int,
    _: User = Depends(require_roles(ROLE_ADMIN, ROLE_OPERATOR)),
    db: Session = Depends(get_db),
):
    soft_delete_detection(db, detection_id)


@router.get("/system-status", summary="Estado del sistema")
async def system_status(_: User = Depends(require_roles(ROLE_ADMIN))):
    return get_system_status()


@router.get("/roles", summary="Listar roles")
async def roles(
    _: User = Depends(require_roles(ROLE_ADMIN)),
    db: Session = Depends(get_db),
):
    return {"roles": user_service.list_roles(db)}


@router.get("/users", summary="Listar usuarios")
async def users(
    _: User = Depends(require_roles(ROLE_ADMIN)),
    db: Session = Depends(get_db),
):
    return {"users": user_service.list_users(db)}


@router.get("/users/{user_id}", summary="Obtener usuario")
async def get_user(
    user_id: int,
    _: User = Depends(require_roles(ROLE_ADMIN)),
    db: Session = Depends(get_db),
):
    return user_service.public_profile(user_service.get_user_by_id(db, user_id))


@router.post("/users", status_code=status.HTTP_201_CREATED, summary="Crear usuario")
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


@router.put("/users/{user_id}", summary="Actualizar usuario")
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


@router.patch("/users/{user_id}/active", summary="Activar o desactivar usuario")
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


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar usuario")
async def delete_user(
    user_id: int,
    actor: User = Depends(require_roles(ROLE_ADMIN)),
    db: Session = Depends(get_db),
):
    user_service.delete_user(db, user_id, actor=actor)
