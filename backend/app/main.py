import sys
from pathlib import Path
try:
    import pyrefly
except ImportError:
    pyrefly = None

# Ensure project root and backend folder are in sys.path for direct script execution and flexible imports
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent

for path in (PROJECT_ROOT, BACKEND_DIR):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
try:
    from backend.app.api.router import router
except ImportError:
    from app.api.router import router

app = FastAPI(
    title="TerraLynx Decision Intelligence API",
    description="Emergency Management and Disaster-Response Decision Intelligence Engine",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def root():
    return {
        "platform": "TerraLynx",
        "tagline": "Predict. Prepare. Protect.",
        "status": "Operational",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "TerraLynx Decision Intelligence API",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True, app_dir=str(PROJECT_ROOT))

