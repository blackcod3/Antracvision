from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone


DAY_LABELS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]


@dataclass
class DetectionEvent:
    id: int
    clase: str
    confidence: float
    severity: str | None  # leve | moderado | crítico | None (sana)
    source: str = "Imagen subida"  # Imagen subida | Cámara
    at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def severe(self) -> bool:
        return self.clase == "Antracnosis" and self.severity == "crítico"


_events: list[DetectionEvent] = []
_next_id = 1
PERIOD_DAYS = 7

SEVERITY_LABELS = {
    "crítico": "Severa",
    "moderado": "Moderada",
    "leve": "Leve",
}


def record_detection(
    clase: str,
    confidence: float = 0.0,
    estado: str | None = None,
    source: str = "Imagen subida",
) -> None:
    global _next_id

    severity = None
    if clase == "Antracnosis":
        # Map detection estados to severity buckets
        if estado == "crítico":
            severity = "crítico"
        elif estado == "moderado":
            severity = "moderado"
        else:
            severity = "leve"

    _events.append(
        DetectionEvent(
            id=_next_id,
            clase=clase,
            confidence=float(confidence),
            severity=severity,
            source=source if source in ("Imagen subida", "Cámara") else "Imagen subida",
        )
    )
    _next_id += 1


def _format_relative_date(at: datetime) -> str:
    local = at.astimezone()
    now = datetime.now().astimezone()
    today = now.date()
    day = local.date()
    time_str = local.strftime("%H:%M")

    if day == today:
        return f"Hoy, {time_str}"
    if day == today - timedelta(days=1):
        return f"Ayer, {time_str}"

    months = (
        "ene", "feb", "mar", "abr", "may", "jun",
        "jul", "ago", "sep", "oct", "nov", "dic",
    )
    return f"{day.day} {months[day.month - 1]}, {time_str}"


def get_recent_detections(limit: int = 5) -> list[dict]:
    recent = sorted(_events, key=lambda e: e.at, reverse=True)[:limit]
    items: list[dict] = []
    for event in recent:
        if event.clase == "Sana":
            status = "Sana"
            label = "Sana"
        else:
            status = SEVERITY_LABELS.get(event.severity or "", "Leve")
            label = "Antracnosis"

        items.append(
            {
                "id": f"#DET-{event.id:04d}",
                "label": label,
                "origin": event.source,
                "status": status,
                "confidence": round(event.confidence * 100),
                "date": _format_relative_date(event.at),
            }
        )
    return items


def _in_window(events: list[DetectionEvent], start: datetime, end: datetime) -> list[DetectionEvent]:
    return [e for e in events if start <= e.at < end]


def _daily_series(events: list[DetectionEvent], days: int = PERIOD_DAYS) -> list[dict]:
    now = datetime.now().astimezone()
    today = now.date()
    buckets: dict[str, dict[str, int]] = {}

    for offset in range(days - 1, -1, -1):
        day = today - timedelta(days=offset)
        key = day.isoformat()
        buckets[key] = {
            "date": key,
            "label": DAY_LABELS_ES[day.weekday()],
            "anthracnose": 0,
            "healthy": 0,
        }

    window_start = datetime.combine(today - timedelta(days=days - 1), datetime.min.time()).astimezone()
    for event in events:
        local = event.at.astimezone()
        if local < window_start:
            continue
        key = local.date().isoformat()
        if key not in buckets:
            continue
        if event.clase == "Antracnosis":
            buckets[key]["anthracnose"] += 1
        elif event.clase == "Sana":
            buckets[key]["healthy"] += 1

    return list(buckets.values())


def get_stats() -> dict:
    now = datetime.now(timezone.utc)
    current_start = now - timedelta(days=PERIOD_DAYS)
    previous_start = now - timedelta(days=PERIOD_DAYS * 2)

    current_events = _in_window(_events, current_start, now)
    previous_events = _in_window(_events, previous_start, current_start)

    source = current_events if current_events else _events

    total = len(source)
    healthy = sum(1 for e in source if e.clase == "Sana")
    anthracnose = sum(1 for e in source if e.clase == "Antracnosis")
    mild = sum(1 for e in source if e.severity == "leve")
    moderate = sum(1 for e in source if e.severity == "moderado")
    severe = sum(1 for e in source if e.severity == "crítico")
    avg_confidence = (
        sum(e.confidence for e in source) / total if total > 0 else 0.0
    )

    previous_total = len(previous_events)
    if previous_total == 0 and len(_events) > total:
        previous_total = len(_events) - total

    if previous_total > 0:
        total_change_pct = ((total - previous_total) / previous_total) * 100
    else:
        total_change_pct = 0.0 if total == 0 else 100.0

    healthy_pct = (healthy / total * 100) if total > 0 else 0.0
    anthracnose_pct = (anthracnose / total * 100) if total > 0 else 0.0

    return {
        "total_detections": total,
        "healthy": healthy,
        "anthracnose": anthracnose,
        "severe": severe,
        "severity": {
            "leve": mild,
            "moderada": moderate,
            "severa": severe,
        },
        "avg_confidence": round(avg_confidence * 100, 1),
        "healthy_pct": round(healthy_pct, 1),
        "anthracnose_pct": round(anthracnose_pct, 1),
        "previous_total": previous_total,
        "total_change_pct": round(total_change_pct, 1),
        "daily": _daily_series(_events, PERIOD_DAYS),
        "recent": get_recent_detections(5),
    }
