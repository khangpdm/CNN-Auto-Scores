import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database.connection import Base, engine
from routers import auth, grading, exam, result, answer_keys, student

Base.metadata.create_all(bind=engine)

app = FastAPI(
    tittle = "SaaS Commercial Grading Engine API",
    description="Hệ thống API chấm điểm thi trắc nghiệm AI",
    version = "3.0.0",
)

STORAGE_DIR = "storage"
os.makedirs(os.path.join(STORAGE_DIR, "uploads"), exist_ok=True)
os.makedirs(os.path.join(STORAGE_DIR, "processed"), exist_ok=True)

app.mount("/static", StaticFiles(directory=STORAGE_DIR), name="static")

app.mount("/storage", StaticFiles(directory=STORAGE_DIR), name="storage")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)