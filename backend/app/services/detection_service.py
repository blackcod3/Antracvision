from __future__ import annotations

import cv2
import numpy as np

from app.core.model_loader import model

# If the classifier is unsure, only keep Antracnosis when dark lesions are visible.
UNCERTAIN_CONFIDENCE = 0.75
MIN_LESION_PCT_IF_UNCERTAIN = 1.5
# Severity is based on visible lesion area, not model confidence.
MODERATE_LESION_PCT = 5.0
SEVERE_LESION_PCT = 15.0


def _to_numpy_probs(probs) -> np.ndarray:
    data = probs.data
    if hasattr(data, "detach"):
        data = data.detach()
    if hasattr(data, "cpu"):
        data = data.cpu()
    return np.asarray(data, dtype=np.float64).reshape(-1)


def _canonical_label(name: str) -> str:
    key = name.strip().lower()
    if "antrac" in key or "anthrac" in key:
        return "Antracnosis"
    if key.startswith("san") or "healthy" in key:
        return "Sana"
    return name.strip().title() or "Desconocida"


def estimate_lesion_coverage(img_array: np.ndarray) -> float:
    """Percentage of fruit pixels that look like dark/brown necrotic tissue."""
    rgb = np.ascontiguousarray(img_array)
    if rgb.ndim != 3 or rgb.shape[2] != 3:
        return 0.0

    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)
    hue, sat, val = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    lightness = lab[:, :, 0]

    background = (val >= 230) & (sat <= 35)
    fruit = ~background
    fruit_pixels = int(fruit.sum())
    if fruit_pixels < 500:
        fruit = np.ones(val.shape, dtype=bool)
        fruit_pixels = int(fruit.size)

    dark = fruit & (lightness <= 95)
    brown = fruit & (hue <= 20) & (sat >= 35) & (val <= 145) & (lightness <= 140)
    lesion_pixels = int((dark | brown).sum())
    return round(100.0 * lesion_pixels / fruit_pixels, 2)


def _estado_for_anthracnose(lesion_pct: float) -> tuple[str, str]:
    if lesion_pct >= SEVERE_LESION_PCT:
        return (
            "crítico",
            "Aislar el fruto afectado y aplicar tratamiento fungicida; consulta a un agrónomo.",
        )
    if lesion_pct >= MODERATE_LESION_PCT:
        return (
            "moderado",
            "Revisar más frutos, mejorar ventilación y considerar tratamiento preventivo.",
        )
    return (
        "leve",
        "Monitorear la evolución y retirar frutos sospechosos; mejorar condiciones de cultivo.",
    )


def predict_image(img_array) -> dict:
    results = model(img_array, verbose=False)
    result = results[0]
    probs = result.probs
    names = result.names or getattr(model, "names", {}) or {}

    scores = _to_numpy_probs(probs)
    by_label: dict[str, float] = {}
    for idx, name in names.items():
        label = _canonical_label(str(name))
        score_idx = int(idx)
        if 0 <= score_idx < scores.size:
            by_label[label] = float(scores[score_idx])

    anth_prob = by_label.get("Antracnosis", 0.0)
    sana_prob = by_label.get("Sana", 0.0)
    lesion_pct = estimate_lesion_coverage(np.asarray(img_array))

    if anth_prob >= sana_prob and anth_prob > 0:
        clase, confidence = "Antracnosis", anth_prob
    elif sana_prob > 0:
        clase, confidence = "Sana", sana_prob
    else:
        top_idx = int(probs.top1)
        raw_name = names.get(top_idx, "Desconocida")
        clase = _canonical_label(str(raw_name))
        confidence = float(probs.top1conf)

    # Yellow/healthy fruit often gets a weak Antracnosis score. Without dark
    # lesions, treat it as Sana instead of inventing a "leve" infection.
    if (
        clase == "Antracnosis"
        and confidence < UNCERTAIN_CONFIDENCE
        and lesion_pct < MIN_LESION_PCT_IF_UNCERTAIN
    ):
        clase = "Sana"
        confidence = sana_prob if sana_prob > 0 else max(0.0, 1.0 - anth_prob)

    if clase == "Sana":
        estado = "saludable"
        recomendacion = (
            "La planta se ve saludable. Mantén buenas prácticas de riego y monitoreo."
        )
    else:
        estado, recomendacion = _estado_for_anthracnose(lesion_pct)

    return {
        "clase": clase,
        "confidence": float(confidence),
        "estado": estado,
        "recomendacion": recomendacion,
        "lesion_pct": lesion_pct,
    }
