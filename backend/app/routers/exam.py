from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from streamlit import status

from database.connection import get_db
from database.models import Exam, ExamStatus, SessionStatus, User, ExamSession, ExamShared, \
    ExamPermission, ExamSession, Student, StudentResult, AnswerKey, ScanBatch
from routers.auth import get_current_user

routers = APIRouter(prefix="/api/v1/exams", tags=["Exams & Sessions Management"])

class CreateExamSchema(BaseModel):
    exam_code:str
    exam_name:str

class CreateSessionSchema(BaseModel):
    session_code: str
    session_name: str
    total_questions: int
    max_score: float = 10.0

class ShareExamSchema(BaseModel):
    teacher_email: str
    permission: ExamPermission = ExamPermission.VIEWER

class UpdateExamSchema(BaseModel):
    exam_name: Optional[str] = None
    status: Optional[ExamStatus] = None

class UpdateSessionSchema(BaseModel):
    session_name: Optional[str] = None
    total_questions: Optional[int] = None
    max_score: Optional[float] = None
    status: Optional[SessionStatus] = None

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

@routers.post("/{exam_id}/share", summary="Chia sẻ quyền quản lý‌/Chấm bài cho giáo viên")
def share_exam_to_teacher(
        exam_id: int,
        data: ShareExamSchema,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user),
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(404, "Kỳ thi không tồn tại")

    if exam.created_by != current_user.id:
        raise HTTPException(403, "Bạn không có quyền chia sẻ kỳ thi này")

    target_teacher = db.query(User).filter(User.email == data.teacher_email.strip()).first()
    if not target_teacher:
        raise HTTPException(404, "Không tìm thấy tài khoản với email này")

    if target_teacher.id == current_user.id:
        raise HTTPException(400, "Bạn không thể chia sẻ kỳ thi cho chính mình")

    already_shared = db.query(ExamShared).filter(
        ExamShared.exam_id == exam_id,
        ExamShared.user_id == current_user.id
    ).first()

    if already_shared:
        already_shared.permission = data.permission
        already_shared.shared_by = current_user.id
        return {
            "status": "success",
            "message": f"Đã cập nhật quyền của giáo viên thành: {data.permission.value}"
        }

    new_share = ExamShared(
        exam_id = exam_id,
        user_id = target_teacher.id,
        permission = data.permission,
        shared_by = current_user.id
    )
    db.add(new_share)
    db.commit()

    return {
        "status": "success",
        "message": f"Đã chia sẻ kỳ thi thành công với quyền '{data.permission.value}' cho {target_teacher.full_name}"
    }

@routers.get("", summary="Lấy danh sách các kỳ thi của tôi hoặc đuợc chia sẻ")
def get_my_exams(
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user),
):
    my_exams = db.query(Exam).filter(Exam.created_by == current_user.id).all()

    shared_records = db.query(ExamShared).filter(ExamShared.user_id == current_user.id).all()

    shared_exams_list = []
    for share in shared_records:
        if share.exam:
            shared_exams_list.append({
                "exam": share.exam,
                "permission": share.permission.value,
                "shared_by": share.shared_by
            })
    return {
        "status": "success",
        "data": {
            "my_exams": my_exams,
            "shared_exams": shared_exams_list
        }
    }

@routers.get("/{exam_id}", summary="Lấy thông tin chi tiết 1 kỳ thi")
def get_exam_detail(
        exam_id: int,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user),
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(404, "Kỳ thi không tồn tại")

    is_shared = db.query(ExamShared).filter(
        ExamShared.exam_id == exam_id,
        ExamShared.user_id == current_user.id
    ).first()

    if exam.created_by != current_user.id and not is_shared:
        raise HTTPException(403, "Bạn không có quyền truy cập kỳ thi này")

    return {
        "status": "success",
        "data": {
            "exam": exam,
            "role_context": "owner" if exam.created_by == current_user.id else is_shared.permission.value,
        }
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

@routers.put("/{exam_id}", summary="Cập nhật tên/ mô tả kỳ thi")
def update_exam(
        exam_id: int,
        data: UpdateExamSchema,
        db:Session = Depends(get_db),
        current_user = Depends(get_current_user),
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(404, "Kỳ thi không tồn tại")

    if exam.created_by != current_user.id:
        share_perm = db.query(ExamShared).filter(
            ExamShared.exam_id == exam_id,
            ExamShared.user_id == current_user.id
        ).first()
        if not share_perm or share_perm.permission != ExamPermission.EDITOR:
            raise HTTPException(403, "Bạn không có quyền chỉnh sửa kỳ thi này")

    if data.exam_name is not None:
        exam.exam_name = data.exam_name.strip()
    if data.status is not None:
        exam.status = data.status

    db.commit()
    db.refresh(exam)
    return {
        "status": "success",
        "message": "Cập nhật thông tin kỳ thi thành công",
        "data": exam
    }

@routers.delete("/{exam_id}",summary="Xóa kỳ thi")
def delete_exam(
        exam_id: int,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user),
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(404, "Kỳ thi không tồn tại")

    if exam.created_by != current_user.id:
        raise HTTPException(403, "Chỉ chủ sở hữu mới có quyền xóa")

    db.delete(exam)
    db.commit()

    return{
        "status": "success",
        "message": f"Đã xóa thành công kỳ thi '{exam.exam_name}' và toàn bộ dữ liệu liên quan"
    }

@routers.get("/{exam_id}/sessions", summary="Lấy danh sách các Đợt thi của kỳ thi này")
def get_exam_session(
        exam_id: int,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user),
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(404, "Kỳ thi không tồn tại")

    is_shared = db.query(ExamShared).filter(
        ExamShared.exam_id == exam_id,
        ExamShared.user_id == current_user.id
    )
    if exam.created_by != current_user.id and not is_shared:
        raise HTTPException(403, "Bạn không có quyền xem thông tin kỳ thi này")

    sessions = db.query(ExamSession).filter(ExamSession.exam_id == exam_id).all()
    return {
        "status": "success",
        "data": sessions
    }

@routers.put("/{exam_id}/sessions/{session_id}", summary="Cập nhật tên/thông tin đợt thi")
def update_exam_session(
        exam_id: int,
        session_id: int,
        data: UpdateSessionSchema,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user),
):
    # 1. Tìm đợt thi theo session_id và exam_id
    session = db.query(ExamSession).filter(
        ExamSession.id == session_id,
        ExamSession.exam_id == exam_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Đợt thi không tồn tại trong kỳ thi này"
        )

    # 2. Kiểm tra phân quyền
    # Nếu không phải người tạo ra Session hoặc Exam gốc
    if session.created_by != current_user.id and session.exam.created_by != current_user.id:
        share_perm = db.query(ExamShared).filter(
            ExamShared.exam_id == exam_id,  # Phải dùng exam_id của Kỳ thi
            ExamShared.user_id == current_user.id
        ).first()

        if not share_perm or share_perm.permission != ExamPermission.EDITOR:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền chỉnh sửa đợt thi này"
            )

    # 3. Cập nhật dữ liệu đúng với trường của ExamSession
    if data.session_name is not None:
        session.session_name = data.session_name.strip()
    if data.total_questions is not None:
        session.total_questions = data.total_questions
    if data.max_score is not None:
        session.max_score = data.max_score
    if data.status is not None:
        session.status = data.status

    db.commit()
    db.refresh(session)

    return {
        "status": "success",
        "message": "Cập nhật thông tin đợt thi thành công",
        "data": session
    }


@routers.delete("/{exam_id}/sessions/{session_id}", summary="Xóa đợt thi")
def delete_exam_session(
        exam_id: int,
        session_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user),
):
    session = db.query(ExamSession).filter(
        ExamSession.id == session_id,
        ExamSession.exam_id == exam_id
    ).first()

    if not session:
        raise HTTPException(404, "Đợt thi không tồn tại")

    if session.created_by != current_user.id and session.exam.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ chủ sở hữu mới có quyền xóa đợt thi này"
        )

    session_name = session.session_name

    db.query(Student).filter(Student.session_id == session_id).delete()
    db.query(StudentResult).filter(StudentResult.session_id == session_id).delete()
    db.query(AnswerKey).filter(AnswerKey.session_id == session_id).delete()
    db.query(ScanBatch).filter(ScanBatch.session_id == session_id).delete()

    db.delete(session)
    db.commit()

    return {
        "status": "success",
        "message": f"Đã xóa thành công đợt thi '{session_name}' và toàn bộ dữ liệu liên quan"
    }

@routers.get("/{exam_id}/sessions/{session_id}", summary="Lấy thông tin chi tiết 1 đợt thi")
def get_exam_detail(
        session_id: int,
        exam_id: int,
        db: Session = Depends(get_db),
        current_user = Depends(get_current_user),
):
    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Đợt thi không tồn tại")

    exam = db.query(Exam).filter(Exam.id == exam_id).first()

    is_shared = db.query(ExamShared).filter(
        ExamShared.exam_id == exam_id,
        ExamShared.user_id == current_user.id
    ).first()

    if session.created_by != current_user.id and not is_shared:
        raise HTTPException(403, "Bạn không có quyền truy cập kỳ thi này")

    return {
        "status": "success",
        "data": {
            "session": session,
            "exam_name": exam.exam_name if exam else None,
            "role_context": "owner" if exam.created_by == current_user.id else is_shared.permission.value,
        }
    }