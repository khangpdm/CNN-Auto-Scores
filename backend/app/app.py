from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.connection import Base, engine
from routers import auth, grading, exam, result

Base.metadata.create_all(bind=engine)

app = FastAPI(
    tittle = "SaaS Commercial Grading Engine API",
    description="Hệ thống API chấm điểm thi trắc nghiệm AI",
    version = "3.0.0",
)

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)