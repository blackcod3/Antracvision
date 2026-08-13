from __future__ import annotations

import base64
import json
import logging
import re
from dataclasses import dataclass

import httpx

from app.core.config import (
    LLM_API_KEY,
    LLM_BASE_URL,
    LLM_MODEL,
    LLM_ORANGE_REJECT_THRESHOLD,
    LLM_VISION_MODEL,
)

logger = logging.getLogger(__name__)

_FALLBACK_RECOMMENDATIONS = {
    "saludable": "La planta se ve saludable. Mantén buenas prácticas de riego y monitoreo.",
    "crítico": "Aislar el fruto afectado y aplicar tratamiento fungicida; consulta a un agrónomo.",
    "moderado": "Revisar más frutos, mejorar ventilación y considerar tratamiento preventivo.",
    "leve": "Monitorear la evolución y retirar frutos sospechosos; mejorar condiciones de cultivo.",
}

_http_client: httpx.Client | None = None


@dataclass(frozen=True)
class OrangeVerification:
    es_naranja: bool
    confianza: float
    motivo: str


def is_llm_configured() -> bool:
    return bool(LLM_API_KEY)


def _client() -> httpx.Client:
    global _http_client
    if _http_client is None:
        _http_client = httpx.Client(timeout=60.0)
    return _http_client


def _chat_completions_url() -> str:
    base = LLM_BASE_URL.rstrip("/")
    if base.endswith("/v1"):
        return f"{base}/chat/completions"
    return f"{base}/v1/chat/completions"


def _data_url(image_bytes: bytes, mime_type: str) -> str:
    b64 = base64.b64encode(image_bytes).decode("ascii")
    return f"data:{mime_type or 'image/jpeg'};base64,{b64}"


def _extract_json(text: str) -> dict:
    raw = (text or "").strip()
    if not raw:
        raise ValueError("Respuesta vacía del modelo")

    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        data = json.loads(match.group(0))
        if isinstance(data, dict):
            return data

    raise ValueError("No se pudo parsear JSON del modelo")


def _chat(
    *,
    model: str,
    messages: list[dict],
    temperature: float,
) -> str:
    headers = {
        "Authorization": f"Bearer {LLM_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://antracvision.local",
        "X-Title": "AntracVision",
    }
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }
    response = _client().post(_chat_completions_url(), headers=headers, json=payload)
    if response.status_code >= 400:
        detail = response.text[:500]
        raise RuntimeError(f"OpenRouter {response.status_code}: {detail}")

    data = response.json()
    choices = data.get("choices") or []
    if not choices:
        raise ValueError("Respuesta sin choices")
    message = choices[0].get("message") or {}
    content = message.get("content")
    if isinstance(content, list):
        parts = []
        for part in content:
            if isinstance(part, dict) and part.get("type") == "text":
                parts.append(str(part.get("text") or ""))
            elif isinstance(part, str):
                parts.append(part)
        return "".join(parts).strip()
    return str(content or "").strip()


def fallback_recommendation(estado: str) -> str:
    return _FALLBACK_RECOMMENDATIONS.get(
        estado,
        _FALLBACK_RECOMMENDATIONS["leve"],
    )


def verify_is_orange(
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
) -> OrangeVerification | None:
    """Return verification result, or None if LLM is unavailable / fails."""
    if not is_llm_configured():
        return None

    prompt = (
        "Analiza la imagen. Determina si muestra una naranja (fruta cítrica Citrus sinensis) "
        "o claramente un fruto de naranja/cítrico similar (mandarina, limón, toronja) en primer plano. "
        "No aceptes otras frutas, hojas sueltas sin fruto, personas, objetos o paisajes. "
        "Responde SOLO con JSON válido (sin markdown) con esta forma exacta:\n"
        '{"es_naranja": boolean, "confianza": number entre 0 y 1, "motivo": string breve en español}'
    )

    try:
        text = _chat(
            model=LLM_VISION_MODEL,
            temperature=0.1,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": _data_url(image_bytes, mime_type)},
                        },
                    ],
                }
            ],
        )
        data = _extract_json(text)
        confianza = float(data.get("confianza", 0.0))
        confianza = max(0.0, min(1.0, confianza))
        return OrangeVerification(
            es_naranja=bool(data.get("es_naranja")),
            confianza=confianza,
            motivo=str(data.get("motivo") or "Sin detalle").strip()[:300],
        )
    except Exception:
        logger.exception("Fallo al verificar naranja con LLM (%s)", LLM_VISION_MODEL)
        return None


def should_reject_non_orange(verification: OrangeVerification | None) -> bool:
    if verification is None:
        return False
    if verification.es_naranja:
        return False
    return verification.confianza >= LLM_ORANGE_REJECT_THRESHOLD


def generate_recommendation(
    *,
    image_bytes: bytes,
    mime_type: str,
    clase: str,
    probabilidad: float,
    estado: str,
) -> str:
    """LLM recommendation with local rule fallback."""
    if not is_llm_configured():
        return fallback_recommendation(estado)

    prompt = (
        "Eres un asistente agronómico especializado en antracnosis (Colletotrichum) en naranjas/cítricos. "
        "Con base en la imagen (si está disponible) y los resultados del clasificador, da una recomendación práctica breve.\n\n"
        f"- Clase del modelo YOLO: {clase}\n"
        f"- Confianza del modelo: {probabilidad:.2%}\n"
        f"- Estado estimado: {estado}\n\n"
        "Reglas:\n"
        "- Responde en español, máximo 3 oraciones.\n"
        "- Sé concreto (aislar fruto, higiene, ventilación, monitoreo, consultar agrónomo).\n"
        "- No inventes nombres comerciales de fungicidas ni dosis ilegales.\n"
        "- Si la clase es Sana, enfócate en prevención y buenas prácticas.\n"
        "- Si hay antracnosis, adapta la urgencia al estado (leve/moderado/crítico).\n"
        "Responde SOLO con el texto de la recomendación, sin títulos ni markdown."
    )

    # Prefer text-only on ANTHROPIC_MODEL (works with free text models like gpt-oss).
    # Fall back to vision model with image if the text model fails.
    try:
        text = _chat(
            model=LLM_MODEL,
            temperature=0.4,
            messages=[{"role": "user", "content": prompt}],
        )
        if text:
            return text[:800]
    except Exception:
        logger.exception("Fallo al generar recomendación con LLM (%s)", LLM_MODEL)

    try:
        text = _chat(
            model=LLM_VISION_MODEL,
            temperature=0.4,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": _data_url(image_bytes, mime_type)},
                        },
                    ],
                }
            ],
        )
        if text:
            return text[:800]
    except Exception:
        logger.exception(
            "Fallo al generar recomendación con LLM visión (%s)",
            LLM_VISION_MODEL,
        )

    return fallback_recommendation(estado)
