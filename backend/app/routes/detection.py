from datetime import datetime, timezone
import io
import uuid
from pathlib import Path
import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile
from PIL import Image
from app.schemas.detection_schema import DetectionResponse
from app.services.detection_service import predict_image
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


@router.post("/detect")
async def detect(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Archivo inválido: se requiere una imagen")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Archivo vacío")
    if len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="La imagen no puede superar 10 MB")

    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="No se pudo leer la imagen")

    img_array = np.array(img)
    clase, confidence = predict_image(img_array)
    probabilidad = float(confidence)

    if clase == "Sana":
        estado = "saludable"
        recomendacion = "La planta se ve saludable. Mantén buenas prácticas de riego y monitoreo."
    else:
        if probabilidad >= 0.85:
            estado = "crítico"
            recomendacion = "Aislar el fruto afectado y aplicar tratamiento fungicida; consulta a un agrónomo."
        elif probabilidad >= 0.65:
            estado = "moderado"
            recomendacion = "Revisar más frutos, mejorar ventilación y considerar tratamiento preventivo."
        else:
            estado = "leve"
            recomendacion = "Monitorear la evolución y retirar frutos sospechosos; mejorar condiciones de cultivo."

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
