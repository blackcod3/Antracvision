from datetime import datetime, timezone

import io
import numpy as np

from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image
from app.schemas.detection_schema import DetectionResponse
from app.services.detection_service import predict_image
from app.services.stats_service import record_detection

router = APIRouter(prefix="/api", tags=["Detection"])

@router.post("/detect")
async def detect(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Archivo inválido: se requiere una imagen")

    raw = await file.read()
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

    record_detection(
        clase,
        probabilidad,
        estado,
        recomendacion=recomendacion,
    )

    return DetectionResponse(
        clase=clase,
        probabilidad=probabilidad,
        confianza_porcentaje=f"{probabilidad * 100:.2f}%",
        estado=estado,
        recomendacion=recomendacion,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
