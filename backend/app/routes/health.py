from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["Health"])


@router.get("/health", summary="Health check")
async def health():
    return {"status": "ok"}

