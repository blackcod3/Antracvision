from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.db.session import Base, SessionLocal, engine
from app.db import models  # noqa: F401 — register metadata
from app.db.seed import seed_database
from app.routes import auth, detection, health, admin


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Create tables if migrations have not been applied yet (dev-friendly).
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="API Detección de Antracnosis",
    version="1.2.0",
    description=(
        "API de AntracVision para autenticación, detección de antracnosis y administración. "
    ),
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    lifespan=lifespan,
    openapi_tags=[
        {"name": "Health", "description": "Disponibilidad del servicio."},
        {"name": "Auth", "description": "Inicio de sesión, perfil y avatar."},
        {"name": "Detection", "description": "Clasificación de imágenes con YOLOv8."},
        {"name": "Admin", "description": "Estadísticas, usuarios y estado del sistema."},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_dir = Path(__file__).resolve().parent / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
(uploads_dir / "avatars").mkdir(parents=True, exist_ok=True)
(uploads_dir / "detections").mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

app.include_router(auth.router)
app.include_router(detection.router)
app.include_router(health.router)
app.include_router(admin.router)
