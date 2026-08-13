from datetime import datetime, timezone
import io
import uuid
from pathlib import Path
import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile
from PIL import Image
from app.schemas.detection_schema import DetectionResponse
from app.services.detection_service import predict_image
from app.services.llm_service import (
    generate_recommendation,
    should_reject_non_orange,
    verify_is_orange,
)
from app.services.stats_service import record_detection

router = APIRouter(prefix="/api", tags=["Detection"])

DETECTIONS_UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "detections"
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_BYTES = 10 * 1024 * 1024


def _save_detection_image(raw: bytes, content_type: str | None) -> str | None:
    DETECTIONS_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }.get(content_type or "", ".jpg")
    filename = f"det-{uuid.uuid4().hex}{ext}"
    dest = DETECTIONS_UPLOAD_DIR / filename
    dest.write_bytes(raw)
    return f"/uploads/detections/{filename}"


def _estado_from_prediction(clase: str, probabilidad: float) -> str:
    if clase == "Sana":
        return "saludable"
    if probabilidad >= 0.85:
        return "crítico"
    if probabilidad >= 0.65:
        return "moderado"
    return "leve"


@router.post("/detect")
async def detect(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Archivo inválido: se requiere una imagen")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Archivo vacío")
    if len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="La imagen no puede superar 10 MB")

    mime_type = file.content_type if file.content_type in ALLOWED_IMAGE_TYPES else "image/jpeg"

    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="No se pudo leer la imagen")

    verification = verify_is_orange(raw, mime_type)
    if should_reject_non_orange(verification):
        motivo = verification.motivo if verification else "No parece una naranja"
        raise HTTPException(
            status_code=400,
            detail=f"La imagen no parece una naranja. {motivo}",
        )

    img_array = np.array(img)
    clase, confidence = predict_image(img_array)
    probabilidad = float(confidence)
    estado = _estado_from_prediction(clase, probabilidad)
    recomendacion = generate_recommendation(
        image_bytes=raw,
        mime_type=mime_type,
        clase=clase,
        probabilidad=probabilidad,
        estado=estado,
    )

    image_url = None
    try:
        image_url = _save_detection_image(raw, file.content_type)
    except OSError:
        image_url = None

    record_detection(
        clase,
        probabilidad,
        estado,
        recomendacion=recomendacion,
        image_url=image_url,
    )

    return DetectionResponse(
        clase=clase,
        probabilidad=probabilidad,
        confianza_porcentaje=f"{probabilidad * 100:.2f}%",
        estado=estado,
        recomendacion=recomendacion,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
