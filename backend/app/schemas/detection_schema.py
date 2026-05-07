from pydantic import BaseModel

class DetectionResponse(BaseModel):
    clase: str
    probabilidad: float
    confianza_porcentaje: str
    estado: str
    recomendacion: str
    timestamp: str