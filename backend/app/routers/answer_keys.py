from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status, Request
from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import (
    ExamSession, AnswerKey, SessionStatus,
    ExamShared, ExamPermission
)
from rate_limiting import limiter
from routers.auth import get_current_user
from services.excel_service import parse_and_save_answer_to_db

routers = APIRouter(prefix="/api/v1", tags=["Answer Keys Management"])

class CreateAnsswerKeySchema(BaseModel):
    test_code: str = Field(..., description="Mã đề, vd: 101, 202,...")
    answers: Dict[str, str] = Field(..., description="Map câu hỏi - đáp án. VD: '1': 'A', '2': 'B'}")
    score_per_question: Optional[Dict[str, float]] = Field(
        default=None,
        description="Map điểm số từng câu. VD: {'1': 0.25, '2': 0.5}. Nếu để None sẽ chia đều theo tổng điểm"
    )

class UpdateAnswerKeySchema(BaseModel):
    test_code: str = Field(...,)
    answers: Optional[Dict[str, str]] = Field(None, description="Cập nhật lại danh sách đáp án")
    score_per_question: Optional[Dict[str, float]] = Field(None, description="Điều chỉnh thang điểm từng câu")

def check_session_permission(
        session_id: int,
        user_id: int,
        db: Session,
        required_permission: Optional[ExamPermission] = None
):
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Đợt thi không tồn tại")

    if session.created_by == user_id or session.exam.created_by == user_id:
        return session

    share_perm = db.query(ExamShared).filter(
        ExamShared.exam_id == session.exam_id,
        ExamShared.user_id == user_id
    ).first()

    if not share_perm:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập vào đợt thi này"
        )

    # Nếu có yêu cầu quyền ghi (EDITOR / GRADER)
    if required_permission:
        if required_permission == ExamPermission.EDITOR and share_perm.permission != ExamPermission.EDITOR:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn cần quyền EDITOR để chỉnh sửa đáp án"
            )

    return session

@routers.post("/session/{session_id}/answers/upload_excels", summary="Upload Excel đáp án")
@limiter.limit("10/minute")
async def upload_exam_answers(
        request: Request,
        session_id: int,
        file_excel: UploadFile = File(...),
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user),
):
    session_obj = check_session_permission(session_id, current_user.id, db, required_permission=ExamPermission.EDITOR)
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

@routers.get("/sessions/{session_id}/answers", summary="Lấy danh sách Mã đề & Đáp án chuẩn hiện có")
@limiter.limit("100/minute")
def get_answer_keys_by_session(
    request: Request,
    session_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Kiểm tra quyền xem
    session_obj = check_session_permission(session_id, current_user.id, db)

    # Lấy danh sách toàn bộ mã đề thuộc session này
    answer_keys = db.query(AnswerKey).filter(AnswerKey.session_id == session_id).all()

    return {
        "status": "success",
        "total_test_codes": len(answer_keys),
        "data": answer_keys
    }

@routers.post("/sessions/{session_id}/answers", summary="Tạo/Thêm thủ công 1 Mã đề mới + Bộ đáp án")
@limiter.limit("10/minute")
def create_manual_answer_key(
    request: Request,
    session_id: int,
    data: CreateAnsswerKeySchema,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    session_obj = check_session_permission(session_id, current_user.id, db, required_permission=ExamPermission.EDITOR)

    existing_key = db.query(AnswerKey).filter(
        AnswerKey.session_id == session_id,
        AnswerKey.test_code == data.test_code.strip()
    ).first()

    if existing_key:
        raise HTTPException(404, f"Mã đề '{data.test_code}' đã tồn tại trong đợt thi này")

    new_answer_key = AnswerKey(
        exam_id=session_obj.exam_id,
        session_id=session_id,
        test_code=data.test_code.strip(),
        answers=data.answers,
        score_per_question=data.score_per_question,
        created_by=current_user.id
    )

    db.add(new_answer_key)

    if session_obj.status == SessionStatus.PENDING:
        session_obj.status = SessionStatus.GRADING

    db.commit()
    db.refresh(new_answer_key)

    return {
        "status": "success",
        "message": f"Tạo thành công mã đề '{new_answer_key.test_code}'",
        "data": new_answer_key
    }

@routers.put("/answers/{answer_key_id}", summary="Sửa đáp án hoặc điều chỉnh điểm từng câu của 1 Mã đề")
@limiter.limit("10/minute")
def update_answer_key(
    request: Request,
    answer_key_id: int,
    data: UpdateAnswerKeySchema,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    answer_key = db.query(AnswerKey).filter(AnswerKey.id == answer_key_id).first()
    if not answer_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bản ghi đáp án không tồn tại"
        )

    check_session_permission(answer_key.session_id, current_user.id, db, required_permission=ExamPermission.EDITOR)

    if data.test_code and data.test_code.strip() != answer_key.test_code:
        exist = db.query(AnswerKey).filter(
            AnswerKey.session_id == answer_key.session_id,
            AnswerKey.test_code == data.test_code.strip(),
        )
        if exist:
            raise HTTPException(
                400, f"Mã đề '{data.test_code}' đã bị trùng với một mã đề khác trong đợt thi này"
            )
        answer_key.test_code = data.test_code.strip()

    if data.answers is not None:
        answer_key.answers = data.answers

    if data.score_per_question is not None:
        answer_key.score_per_question = data.score_per_question

    db.commit()
    db.refresh(answer_key)

    return {
        "status": "success",
        "message": "Cập nhật đáp án/thang điểm thành công",
        "data": answer_key
    }

@routers.delete("/answers/{answer_key_id}", summary="Xóa 1 Mã đề")
@limiter.limit("5/minute")
def delete_answer_key(
    request: Request,
    answer_key_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    answer_key = db.query(AnswerKey).filter(AnswerKey.id == answer_key_id).first()
    if not answer_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bản ghi đáp án không tồn tại"
        )

    # Check quyền xóa
    check_session_permission(answer_key.session_id, current_user.id, db, required_permission=ExamPermission.EDITOR)

    test_code = answer_key.test_code
    db.delete(answer_key)
    db.commit()

    return {
        "status": "success",
        "message": f"Đã xóa thành công mã đề '{test_code}'"
    }