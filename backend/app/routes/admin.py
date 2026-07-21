from fastapi import APIRouter, Depends

from app.core.security import verify_token
from app.services.stats_service import get_recent_detections, get_stats
from app.services.system_status_service import get_system_status

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/stats")
async def stats(_: str = Depends(verify_token)):
    return get_stats()


@router.get("/detections")
async def detections(limit: int = 100, _: str = Depends(verify_token)):
    capped = max(1, min(limit, 200))
    return {"detections": get_recent_detections(capped)}


@router.get("/system-status")
async def system_status(_: str = Depends(verify_token)):
    return get_system_status()

