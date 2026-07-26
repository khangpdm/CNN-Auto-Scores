from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from typing import List, Optional
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session
from datetime import datetime

from database.connection import get_db
from database.models import (
    ExamSession, Student, ExamShared, ExamPermission
)
from routers.auth import get_current_user
from services.excel_service import parse_and_save_student_from_excel

routers = APIRouter(prefix="/api/v1", tags=["Students Management"])

class CreateStudentSchema(BaseModel):
    student_code: str = Field(..., description="Số báo danh / Mã học sinh")
    full_name: str = Field(..., description="Họ và tên học sinh")
    class_name: Optional[str] = Field(None, description="Tên lớp (ví dụ: 12A1)")
    room: Optional[str] = Field(None, description="Phòng thi (ví dụ: P01)")
    gender: Optional[str] = Field(None, description="Giới tính (Nam/Nữ)")
    dob: Optional[datetime] = Field(None, description="Ngày sinh (YYYY-MM-DD)")
    note: Optional[str] = Field(None, description="Ghi chú thêm")

class UpdateStudentSchema(BaseModel):
    student_code: Optional[str] = Field(None, description="Cập nhật Số báo danh")
    full_name: Optional[str] = Field(None, description="Cập nhật Họ và tên")
    class_name: Optional[str] = Field(None, description="Cập nhật Lớp")
    room: Optional[str] = Field(None, description="Cập nhật Phòng thi")
    gender: Optional[str] = Field(None, description="Cập nhật Giới tính")
    dob: Optional[datetime] = Field(None, description="Cập nhật Ngày sinh")
    note: Optional[str] = Field(None, description="Cập nhật Ghi chú")

def check_session_permission(
    session_id: int,
    user_id: int,
    db: Session,
    required_permission: Optional[ExamPermission] = None
):
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise HTTPException(
            404, "Đợt thi không tồn tại"
        )
    if session.created_by == user_id or session.exam.created_by == user_id:
        return session
    share_perm = db.query(ExamShared).filter(
        ExamShared.exam_id == session.exam_id,
        ExamShared.user_id == user_id
    ).first()

    if not share_perm:
        raise HTTPException(
            403, "Bạn không có quyền truy cập vào đợt thi này"
        )
    if required_permission:
        if required_permission == ExamPermission.EDITOR and share_perm.permission != ExamPermission.EDITOR:
            raise HTTPException(
                403, "Bạn cần quyền EDITOR để chỉnh sửa danh sách học sinh"
            )
    return session

@routers.post("/session/{session_id}/upload_students", summary="Upload Excel danh sách học sinh")
async def upload_student_excel(
        session_id: int,
        file_excel: UploadFile = File(...),
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user),
):
    session_obj = check_session_permission(session_id, current_user.id, db, required_permission=ExamPermission.EDITOR)

    # Validate đuôi file
    if not (file_excel.filename.endswith(".xlsx") or file_excel.filename.endswith(".xls")):
        raise HTTPException(
            400,
            "Chỉ chấp nhận file Excel dạng .xlsx hoặc .xls"
        )

    try:
        exel_bytes = await file_excel.read()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Không thể đọc file: {str(e)}"
        )
    try:
        result = parse_and_save_student_from_excel(
            excel_bytes = exel_bytes,
            session_id = session_obj.id,
            created_by = current_user.id,
            db = db
        )
    except ValueError as e:
        raise HTTPException(
            status_code = 400,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi xử lý file: {str(e)}"
        )

    return {
        "status": "success",
        "message": f"Đã import {result['success']}/{result['total']} học sinh",
        "data": {
            "total": result['total'],
            "success": result['success'],
            "errors": result['errors'],
            "students": result['students']
        }
    }

@routers.get("/session/{session_id}/students", summary="Lấy danh sách học sinh")
def get_students_by_session(
    session_id: int,
    search: Optional[str] = Query(None, description="Tìm kiếm theo Tên hoặc Số báo danh (SBD)"),
    page: int = Query(1, ge = 1, description="Trang hiện tại (Mặc định 1)"),
    page_size: int = Query(50, ge=1, le=200, description="Số lượng học sinh / trang"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_session_permission(session_id, current_user.id, db)
    query = db.query(Student).filter(Student.session_id == session_id)

    if search and search.strip():
        search_kw = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Student.student_code.ilike(search_kw),
                Student.full_name.ilike(search_kw)
            )
        )

    total_records = query.count()

    offset = (page - 1) * page_size
    students = query.order_by(Student.student_code.asc()).offset(offset).limit(page_size).all()

    total_pages = (total_records + page_size - 1) / page_size if total_records > 0 else 0

    return {
        "status": "success",
        "pagination": {
            "total_records": total_records,
            "total_pages": total_pages,
            "current_page": page,
            "page_size": page_size
        },
        "data": students
    }

@routers.post("/session/{session_id}/students", summary="Thêm thủ công 1 học sinh")
def create_manual_student(
        session_id: int,
        data: CreateStudentSchema,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user),
):
    session_obj = check_session_permission(session_id, current_user.id, db, required_permission=ExamPermission.EDITOR)

    existing_student = db.query(Student).filter(
        Student.session_id == session_id,
        Student.student_code == data.student_code.strip()
    ).first()

    if existing_student:
        raise HTTPException(
            400, f"Số báo danh '{data.student_code}' đã tồn tại trong đợt thi này"
        )

    new_student = Student(
        session_id=session_id,
        created_by=current_user.id,
        student_code=data.student_code.strip(),
        full_name=data.full_name.strip(),
        class_name=data.class_name.strip() if data.class_name else None,
        room=data.room.strip() if data.room else None,
        gender=data.gender.strip() if data.gender else None,
        dob=data.dob,
        note=data.note
    )

    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    return {
        "status": "success",
        "message": f"Thêm thành công học sinh '{new_student.full_name}'",
        "data": new_student
    }

@routers.put("/student/{student_id}", summary="Sửa thông tin 1 học sinh")
def update_student(
        student_id: int,
        data: UpdateStudentSchema,
        db:Session = Depends(get_db),
        current_user = Depends(get_current_user),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(404, "Học sinh không tồn tại")

    check_session_permission(student.id, current_user.id, db, required_permission=ExamPermission.EDITOR)

    if data.student_code and data.student_code.strip() != student.student_code:
        exist = db.query(Student).filter(
            Student.session_id == student.session_id,
            Student.student_code == data.student_code.strip()
        )
        if exist:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Số báo danh '{data.student_code}' đã được dùng bởi học sinh khác trong đợt thi này"
            )
        student.student_code = data.student_code.strip()

    if data.full_name is not None:
        student.full_name = data.full_name.strip()
    if data.class_name is not None:
        student.class_name = data.class_name.strip()
    if data.room is not None:
        student.room = data.room.strip()
    if data.gender is not None:
        student.gender = data.gender.strip()
    if data.dob is not None:
        student.dob = data.dob
    if data.note is not None:
        student.note = data.note

    db.commit()
    db.refresh(student)

    return {
        "status": "success",
        "message": "Cập nhật thông tin học sinh thành công",
        "data": student
    }

@routers.delete("/students/{student_id}", summary="Xóa 1 học sinh")
def delete_student(
        student_id: int,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            404, "Học sinh không tồn tại"
        )

    check_session_permission(student.session_id, current_user.id, db, required_permission=ExamPermission.EDITOR)

    student_name = student.full_name
    student_code = student.student_code

    db.delete(student)
    db.commit()

    return {
        "status": "success",
        "message": f"Đã xóa thành công học sinh '{student_name}' (SBD: {student_code})"
    }