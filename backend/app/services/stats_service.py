from __future__ import annotations
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.models import Detection
from app.db.session import SessionLocal

DAY_LABELS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
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
    recomendacion: str | None = None,
    image_url: str | None = None,
    user_id: int | None = None,
    db: Session | None = None,
) -> Detection:
    severity = None
    if clase == "Antracnosis":
        if estado == "crítico":
            severity = "crítico"
        elif estado == "moderado":
            severity = "moderado"
        else:
            severity = "leve"

    owns_session = db is None
    session = db or SessionLocal()
    try:
        event = Detection(
            clase=clase,
            confidence=float(confidence),
            severity=severity,
            source=source if source in ("Imagen subida", "Cámara") else "Imagen subida",
            estado=estado,
            recomendacion=recomendacion,
            image_url=image_url,
            is_active=True,
            user_id=user_id,
        )
        session.add(event)
        session.commit()
        session.refresh(event)
        return event
    except Exception:
        session.rollback()
        raise
    finally:
        if owns_session:
            session.close()


def _format_relative_date(at: datetime) -> str:
    if at.tzinfo is None:
        at = at.replace(tzinfo=timezone.utc)
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


def _serialize_detection(event: Detection) -> dict:
    if event.clase == "Sana":
        status = "Sana"
        label = "Sana"
    else:
        status = SEVERITY_LABELS.get(event.severity or "", "Leve")
        label = "Antracnosis"

    return {
        "id": event.id,
        "code": f"#DET-{event.id:04d}",
        "label": label,
        "origin": event.source,
        "status": status,
        "confidence": round(event.confidence * 100),
        "date": _format_relative_date(event.created_at),
        "image_url": event.image_url,
        "recomendacion": event.recomendacion,
        "estado": event.estado,
    }


def _active_query():
    return select(Detection).where(Detection.is_active.is_(True))


def _as_list(db: Session) -> list[Detection]:
    return list(
        db.scalars(_active_query().order_by(Detection.created_at.asc())).all()
    )


def get_recent_detections(limit: int = 5, db: Session | None = None) -> list[dict]:
    owns_session = db is None
    session = db or SessionLocal()
    try:
        recent = list(
            session.scalars(
                _active_query().order_by(Detection.created_at.desc()).limit(limit)
            ).all()
        )
        return [_serialize_detection(event) for event in recent]
    finally:
        if owns_session:
            session.close()


def get_detection_by_id(db: Session, detection_id: int) -> Detection:
    event = db.scalar(
        select(Detection).where(Detection.id == detection_id, Detection.is_active.is_(True))
    )
    if event is None:
        raise HTTPException(status_code=404, detail="Detección no encontrada")
    return event


def soft_delete_detection(db: Session, detection_id: int) -> None:
    event = get_detection_by_id(db, detection_id)
    event.is_active = False
    db.add(event)
    db.commit()


def _in_window(events: list[Detection], start: datetime, end: datetime) -> list[Detection]:
    result = []
    for event in events:
        at = event.created_at
        if at.tzinfo is None:
            at = at.replace(tzinfo=timezone.utc)
        if start <= at < end:
            result.append(event)
    return result


def _daily_series(events: list[Detection], days: int = PERIOD_DAYS) -> list[dict]:
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
        at = event.created_at
        if at.tzinfo is None:
            at = at.replace(tzinfo=timezone.utc)
        local = at.astimezone()
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


def get_stats(db: Session | None = None) -> dict:
    owns_session = db is None
    session = db or SessionLocal()
    try:
        events = _as_list(session)
        now = datetime.now(timezone.utc)
        current_start = now - timedelta(days=PERIOD_DAYS)
        previous_start = now - timedelta(days=PERIOD_DAYS * 2)

        current_events = _in_window(events, current_start, now)
        previous_events = _in_window(events, previous_start, current_start)

        source = current_events if current_events else events

        total = len(source)
        healthy = sum(1 for e in source if e.clase == "Sana")
        anthracnose = sum(1 for e in source if e.clase == "Antracnosis")
        mild = sum(1 for e in source if e.severity == "leve")
        moderate = sum(1 for e in source if e.severity == "moderado")
        severe = sum(1 for e in source if e.severity == "crítico")
        avg_confidence = sum(e.confidence for e in source) / total if total > 0 else 0.0

        previous_total = len(previous_events)
        if previous_total == 0 and len(events) > total:
            previous_total = len(events) - total

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
            "daily": _daily_series(events, PERIOD_DAYS),
            "recent": get_recent_detections(5, db=session),
        }
    finally:
        if owns_session:
            session.close()
