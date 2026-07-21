# AntracVision

Sistema de detección de antracnosis en cultivos mediante visión artifical. Incluye un backend en **FastAPI (Python)** con un modelo YOLOV8, y un frontend en **Next.js (React)** para detección, educación y panel de administración.

# Desarrollado por:
Marco Antonio Macedo Jugo
Bachiller en Ingeniería de Sistemas e Informática

## Estructura del proyecto

```
Antracvision/
├── backend/          # API FastAPI + modelo YOLOV8
│   ├── app/
│   │   ├── core/     # Config, seguridad, carga del modelo
│   │   ├── models/   # Pesos del modelo (.pt)
│   │   ├── routes/   # Auth, detección, health, admin
│   │   ├── schemas/
│   │   └── services/
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
└── frontend/         # App Next.js (App Router)
    ├── app/          # Páginas: inicio, detect, login, admin, antracnosis
    ├── components/
    └── lib/
```

## Requisitos

- **Backend:** Python 3.11+ (recomendado 3.13 para Docker), `pip` / venv
- **Frontend:** Node.js 20+ y npm
- Modelo YOLOV8 en `backend/app/models/` (ruta configurable con `MODEL_PATH`)

---

## Backend (FastAPI)

### Instalación

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Variables de entorno

Crea `backend/.env` (no se versiona):

```env
APP_NAME=API Detección de Antracnosis
APP_VERSION=1.0.0

SECRET_KEY=cambia-esta-clave
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu-password

MODEL_PATH=app/models/yolov8_cls_best.pt
FRONTEND_URL=http://localhost:3000
```

### Arranque en desarrollo

Desde la carpeta `backend/`:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- API: [http://localhost:8000](http://localhost:8000)
- Docs Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)

### Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/health` | Estado del servicio |
| `POST` | `/api/detect` | Detección a partir de una imagen |
| `POST` | `/api/auth/login` | Login de administrador |
| `GET` | `/api/admin/stats` | Estadísticas (protegido) |
| `GET` | `/api/admin/system-status` | Estado del sistema (protegido) |

### Docker

```bash
cd backend
docker build -t antracvision-api .
docker run --env-file .env -p 8000:8000 antracvision-api
```

---

## Frontend (Next.js)

### Instalación

```bash
cd frontend
npm install
```

### Variables de entorno

Copia el ejemplo y ajústalo:

```bash
cp .env.example .env
```

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ANTHRAC_EDU_YOUTUBE_ID=
```

### Arranque en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Sirve el build |
| `npm run lint` | ESLint |

### Rutas de la app

| Ruta | Descripción |
|------|-------------|
| `/` | Landing / información |
| `/detect` | Subida de imagen y detección |
| `/antracnosis` | Contenido educativo |
| `/login` | Acceso admin |
| `/admin` | Panel de administración |

---

## Desarrollo local (ambos)

1. Arranca el backend en el puerto **8000**.
2. Arranca el frontend en el puerto **3000** con `NEXT_PUBLIC_API_URL=http://localhost:8000`.
3. Usa **Detección** en la UI o `/docs` del backend para probar la API.

## Stack

- **Backend:** FastAPI, Uvicorn, Ultralytics (YOLO), Pillow, OpenCV, PyJWT
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Lucide React
