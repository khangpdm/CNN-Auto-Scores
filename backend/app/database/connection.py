import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Lấy đường dẫn tuyệt đối của thư mục dự án
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Cấu hình Database (SQLite cho Local)
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'app_data.db')}"

# Tạo Engine kết nối
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # Cần cho SQLite
)

# Tạo Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency cung cấp DB Session cho FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()