from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth, detection, health, admin

app = FastAPI(
    title="API Detección de Antracnosis",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas
app.include_router(auth.router)
app.include_router(detection.router)
app.include_router(health.router)
app.include_router(admin.router)