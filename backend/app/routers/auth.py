from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, UserRole, AuditLog

SECRET_KEY = "YOUR_SUPER_SECRET_KEY_PRODUCTION_CHANGE_ME"
REFRESH_SECRET_KEY = "YOUR_SUPER_REFRESH_SECRET_KEY_PRODUCTION_CHANGE_ME"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 2
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


# --- Schemas ---
class RegisterSchema(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str

class RefreshTokenRequestSchema(BaseModel):
    refresh_token: str

class TokenResponseSchema(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_info: dict

class ProfileUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None

class ChangePasswordSchema(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)

# --- Helpers ---
def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Token không hợp lệ hoặc đã hết hạn",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")

        if user_id is None or token_type != "access":
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id), User.is_active == True).first()
    if user is None:
        raise credentials_exception

    return user


# --- Endpoints ---
@router.post("/register", summary="Đăng ký tài khoản giáo viên")
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username đã tồn tại!")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email đã được sử dụng!")

    user = User(
        username=data.username.strip(),
        email=data.email.lower().strip(),
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name.strip(),
        role=UserRole.TEACHER,
        is_active=True
    )
    db.add(user)
    db.commit()
    return {"status": "success", "message": "Tạo tài khoản thành công"}


@router.post("/login", response_model=TokenResponseSchema, summary="Đăng nhập")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Tài khoản hoặc mật khẩu không chính xác")

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Tài khoản của bạn đã bị khóa"
        )

    user.last_login = datetime.utcnow()

    # Ghi log lịch sử đăng nhập
    log = AuditLog(
        user_id=user.id,
        action="LOGIN",
        table_name="users",
        record_id=user.id,
        new_data={"login_time": str(user.last_login)}
    )
    db.add(log)
    db.commit()

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_info": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role.value if hasattr(user.role, 'value') else user.role
        },
    }

@router.post("/refresh", summary="Lấy access_token mới bằng refresh_token")
def refresh_token(body: RefreshTokenRequestSchema, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(401, "Refresh token không hợp lệ hoặc đã hết hạn")
    try:
        payload = jwt.decode(body.refresh_token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")

        if user_id is None or token_type != "refresh":
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id), User.is_active == True).first()
    if not user:
        raise credentials_exception

    # Tạo access_token mới
    new_access_token = create_access_token(data={"sub": str(user.id)})

    return {
        "status": "success",
        "access_token": new_access_token,
        "token_type": "bearer"
    }

@router.post("/logout", summary="Đăng xuất")
def logout(current_user: User = Depends(get_current_user)):
    return {
        "status": "success",
        "message": "Đăng xuất thành công"
    }

@router.get("/me", summary="Lấy thông tin tài khoản hiện tại")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "status": "success",
        "data": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role.value if hasattr(current_user.role, 'value') else current_user.role,
            "created_at": current_user.created_at if hasattr(current_user, "created_at") else None
        }
    }

@router.put("/profile", summary="Đổi thông tin cá nhân")
def update_profile(
        data:ProfileUpdateSchema,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    if data.email and data.email.lower() != current_user.email:
        exist = db.query(User).filter(User.email == data.email.lower()).first()
        if exist:
            raise HTTPException(status_code=400, detail="Email này đã được sử dụng bởi người dùng khác")
        current_user.email = data.email.lower().strip()

    if data.full_name:
        current_user.full_name = data.full_name.strip()

    db.commit()
    db.refresh(current_user)

    return {
        "status": "success",
        "message": "Cập nhật thông tin cá nhân thành công",
        "data": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
        }
    }

@router.put("/change-password", summary="Đổi mật khẩu")
def change_password(
    data: ChangePasswordSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Mật khẩu cũ không chính xác"
        )

    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()

    return {
        "status": "success",
        "message": "Đổi mật khẩu thành công"
    }