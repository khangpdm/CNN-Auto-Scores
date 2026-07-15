from pydantic import BaseModel
from typing import List, Optional, Dict
from enum import Enum
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database.connection import get_db
from database.models import User, ScanBatch
from routers.auth import get_current_user
from services.results_service import (
    get_results_list,
    get_result_detail,
    manual_edit_result
)

class ResultStatus(str, Enum):
    VALID = "VALID"
    NEED_REVIEW = "NEED_REVIEW"
    MISSING_SBD = "MISSING_SBD"
    MISSING_TEST_CODE = "MISSING_TEST_CODE"
    UNKNOWN = "UNKNOWN"

class ResultSummary(BaseModel):
    total_submitted: int
    valid_count: int
    warning_count: int

class ResultItem(BaseModel):
    result_id: Optional[int]
    image_url: str
    student_code: Optional[str]
    student_name: Optional[str]
    test_code: Optional[str]
    total_score: float
    status: ResultStatus
    is_manually_edited: bool
    warnings: List[str]
    batch_id: Optional[int]

class ResultListResponse(BaseModel):
    summary: ResultSummary
    items: List[ResultItem]

class QuestionDetail(BaseModel):
    question_number: int
    student_answer: Optional[str]
    correct_answer: Optional[str]
    is_correct: bool
    earned_score: float
    max_score: float

class ResultDetailResponse(BaseModel):
    result_id: int
    image_url: str
    student_code: Optional[str]
    student_name: Optional[str]
    test_code: Optional[str]
    total_score: float
    status: ResultStatus
    is_manually_edited: bool
    questions: List[QuestionDetail]

class ManualEditRequest(BaseModel):
    student_code: Optional[str] = None
    test_code: Optional[str] = None
    answers: Optional[Dict[str,str]] = None

router = APIRouter(prefix="/api/v1", tags=["Result & Manual Edit"])

@router.get("/sessions/{session_id}/results", summary="Lấy danh sách kết quả bài thi")
def get_results(
        session_id: int,
        status_filter: str = Query("ALL", enum=["ALL", "WARNING_ONLY", "VALID_ONLY"]),
        search: Optional[str] = Query(None, description="Tìm theo SBD hoặc tên"),
        page: int = Query(1, ge=1),
        limit: int = Query(50, ge=1, le=100),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    try:
        data = get_results_list(
            session_id=session_id,
            db = db,
            status_filter = status_filter,
            search = search,
            page = page,
            limit = limit
        )
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/results/{result_id}", summary="Chi tiết 1 bài thi")
def get_result_detail_app(
        result_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    try:
        data = get_result_detail(result_id, db)
        return {"status": "success", "data": data}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/result/{result_id}", summary="Giáo viên chỉnh sửa tay")
def manual_edit(
        result_id: int,
        edit_data: ManualEditRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    try:
        data = manual_edit_result(
            result_id=result_id,
            edit_data=edit_data.dict(exclude_none=True),
            db=db,
            verified_by=current_user.id
        )
        return {"status": "success", "data": data}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
