from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.sql.coercions import expect
from streamlit import status

from database.connection import get_db
from database.models import Exam, ExamStatus, AnswerKey, ExamStatus, SessionStatus, User, ExamSession
from routers.auth import get_current_user
from services.excel_service import parse_and_save_answer_to_db, parse_and_save_student_from_excel

routers = APIRouter(prefix="/api/v1/exams", tags=["Exams & Sessions Management"])

class CreateExamSchema(BaseModel):
    exam_code:str
    exam_name:str

class CreateSessionSchema(BaseModel):
    session_code: str
    session_name: str
    total_questions: int
    max_score: float = 10.0

@routers.post("", summary="Tạo kỳ thi mới")
def create_exam(
        data: CreateExamSchema,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user),
):
    existing = db.query(Exam).filter(
        Exam.created_by == current_user.id,
        Exam.exam_code == data.exam_code
    ).first()
    if existing:
        raise HTTPException(status_code = 400, detail = f"Bạn đã có kỳ thi '{data.exam_code}'")

    new_exam = Exam(
        exam_code = data.exam_code,
        exam_name = data.exam_name,
        created_by = current_user.id,
        status = ExamStatus.DRAFT
    )
    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)

    return {
        "status": "success",
        "exam_id": new_exam.id,
        "message": "Tạo kỳ thi mới thành công",
    }
@routers.post("/{exam_id}/sessions", summary="Tạo Đợt thi mới")
def create_exam_session(
        exam_id:int,
        data: CreateSessionSchema,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user),
):
    existing = db.query(Exam).filter(
        Exam.id == exam_id,
    ).first()
    if not existing:
        raise HTTPException(status_code = 404, detail = "Kỳ thi không tồn tại")
    existing_session = db.query(ExamSession).filter(
        ExamSession.exam_id == exam_id,
        ExamSession.session_code == data.session_code,
    ).first()
    if existing_session:
        raise HTTPException(status_code= 400, detail=f"Đợt thi '{data.session_code}' đã tồn tại trong kỳ thi này")

    new_session = ExamSession(
        exam_id = exam_id,
        session_code = data.session_code,
        session_name = data.session_name,
        total_questions = data.total_questions,
        max_score = data.max_score,
        status = SessionStatus.PENDING,
        created_by = current_user.id,
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return {
        "status": "success",
        "session_id": new_session.id,
        "message": "Tạo đợt thi thành công"
    }
@routers.post("/session/{session_id}/upload_students", summary="Upload Excel danh sách học sinh")
async def upload_exam_students(
        session_id: int,
        file_excel: UploadFile = File(...),
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user),
):
    session_obj = db.query(ExamSession).filter(
        ExamSession.id == session_id
    ).first()
    if not session_obj:
        raise HTTPException(status_code = 400, detail="Đợt thi không tồn tại")
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

@routers.post("/session/{session_id}/upload_answers", summary="Upload Excel đáp án")
async def upload_exam_answers(
        session_id: int,
        file_excel: UploadFile = File(...),
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user),
):
    session_obj = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code = 404, detail="Đợt thi không tồn tại")
    if not (file_excel.filename.endswith(".xlsx") or file_excel.filename.endswith(".xls")):
        raise HTTPException(
            status_code = 400,
            detail="Chỉ chấp nhận file Excel(.xlsx, .xls)"
        )

    try:
        exel_bytes = await file_excel.read()
    except Exception as e:
        raise HTTPException(
            status_code = 400,
            detail=f"Không thể đọc file: {str(e)}"
        )
    try:
        result = parse_and_save_answer_to_db(
            excel_bytes = exel_bytes,
            exam_id = session_obj.exam_id,
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
            status_code = 500,
            detail=f"Lỗi khi xử lý file: {str(e)}"
        )
    session_obj.status = SessionStatus.GRADING
    db.commit()

    return {
        "status": "success",
        "message": f"Đã nạp đáp án cho {len(result)} mã đề",
        "loaded_test_codes": result
    }
