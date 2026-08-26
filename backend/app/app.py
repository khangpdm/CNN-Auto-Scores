import os

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

# STORAGE_DIR = "storage"
# os.makedirs(os.path.join(STORAGE_DIR, "uploads"), exist_ok=True)
# os.makedirs(os.path.join(STORAGE_DIR, "processed"), exist_ok=True)
#
# app.mount("/static", StaticFiles(directory=STORAGE_DIR), name="static")
#
# app.mount("/storage", StaticFiles(directory=STORAGE_DIR), name="storage")


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

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port)