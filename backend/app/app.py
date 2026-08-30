import os
from pathlib import Path
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from database.connection import Base, engine
from sqlalchemy.orm import Session
from sqlalchemy import text
from database.connection import get_db
from rate_limiting import limiter
from routers import auth, grading, exam, result, answer_keys, student

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title = "SaaS Commercial Grading Engine API",
    description="Hệ thống API chấm điểm thi trắc nghiệm AI",
    version = "3.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

BASE_DIR = Path(__file__).resolve().parent

STORAGE_DIR = BASE_DIR / "storage"
UPLOADS_DIR = STORAGE_DIR / "uploads"
PROCESSED_DIR = STORAGE_DIR / "processed"
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

app.mount("/storage", StaticFiles(directory=str(STORAGE_DIR)), name="storage")
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
app.mount("/processed", StaticFiles(directory=str(PROCESSED_DIR)), name="processed")


origins = [
    "https://asc-marker.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(exam.routers)
app.include_router(grading.router)
app.include_router(result.router)
app.include_router(answer_keys.routers)
app.include_router(student.routers)


@app.get("/")
def read_root():
    return {"status": "FastAPI Cloud is connected!"}

@app.get("/db-check")
def check_db_connection(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT version();")).fetchone()
        return {"database_status": "Connected successfully", "version": result[0]}
    except Exception as e:
        return {"database_status": "Connection failed", "error": str(e)}


@app.get("/debug/files")
async def debug_files():
    """Kiểm tra các file trong storage"""
    import os
    from pathlib import Path

    storage_dir = Path("storage")
    processed_dir = storage_dir / "processed"
    uploads_dir = storage_dir / "uploads"

    result = {
        "storage_exists": storage_dir.exists(),
        "processed_exists": processed_dir.exists(),
        "uploads_exists": uploads_dir.exists(),
        "processed_files": [],
        "uploads_files": [],
        "storage_path": str(storage_dir.absolute()),
    }

    if processed_dir.exists():
        result["processed_files"] = [f.name for f in processed_dir.glob("*")][:20]
        result["processed_count"] = len(list(processed_dir.glob("*")))

    if uploads_dir.exists():
        result["uploads_files"] = [f.name for f in uploads_dir.glob("*")][:20]
        result["uploads_count"] = len(list(uploads_dir.glob("*")))

    return result

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port)