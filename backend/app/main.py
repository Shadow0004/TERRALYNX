import sys
from pathlib import Path

# Ensure project root is in sys.path for direct script execution and imports
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.router import router

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True, app_dir=str(PROJECT_ROOT))

