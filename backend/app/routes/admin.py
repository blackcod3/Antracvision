from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.security import get_current_user, require_roles
from app.db.models import User
from app.db.session import get_db
from app.db.seed import ROLE_ADMIN, ROLE_OPERATOR
from app.services.stats_service import get_recent_detections, get_stats
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


@router.get("/system-status")
async def system_status(_: User = Depends(require_roles(ROLE_ADMIN))):
    return get_system_status()
