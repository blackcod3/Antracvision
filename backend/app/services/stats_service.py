from __future__ import annotations

from dataclasses import dataclass


@dataclass
class DetectionStats:
    total_detections: int = 0
    healthy: int = 0
    anthracnose: int = 0


_stats = DetectionStats()


def record_detection(clase: str) -> None:
    _stats.total_detections += 1
    if clase == "Sana":
        _stats.healthy += 1
    elif clase == "Antracnosis":
        _stats.anthracnose += 1


def get_stats() -> dict:
    return {
        "total_detections": _stats.total_detections,
        "healthy": _stats.healthy,
        "anthracnose": _stats.anthracnose,
    }

