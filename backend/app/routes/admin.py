from fastapi import APIRouter, Depends

from app.core.security import verify_token
from app.services.stats_service import get_stats

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/stats")
async def stats(_: str = Depends(verify_token)):
    return get_stats()

