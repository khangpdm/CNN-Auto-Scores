from sqlalchemy.orm import Session
from database.models import StudentResult, Student, ExamSession, AnswerKey, ScanBatch
from typing import List, Optional, Dict
from datetime import datetime

def get_result_detail(
        result_id: int,
        db: Session,
):
    result = db.query(StudentResult).filter(StudentResult.id == result_id).first()
    if not result:
        raise ValueError("Không tìm thấy kết quả")

    student = result.student if result.student_id else None

    status, _ = get_result_detail(result, student)

    questions = []
    if result.answers:
        for q_num, q_data in result.answers.items():
            questions.append({
                "question_number": int(q_num),
                "student_answer": q_data.get("choice"),
                "correct_answer": q_data.get("correct_answer"),
                "is_correct": q_data.get("is_correct", False),
                "earned_score": q_data.get("earned_score", 0.0),
                "max_score": q_data.get("max_score", 0.0)
            })

    questions.sort(key=lambda x: x["question_number"])

    return {
        "result_id": result_id,
        "image_url": result.processed_image_path or result.raw_image_path,
        "student_code": result.student_code,
        "student_name": student.full_name if student else None,
        "test_code": result.detected_test_code,
        "total_score": result.score,
        "status": status,
        "is_manually_edited": result.is_manually_override,
        "questions": questions
    }

def manual_edit_result(
        result_id: int,
        edit_data: dict,
        db: Session,
        verified_by: int
):
    result = db.query(StudentResult).filter(StudentResult.id == result_id).first()
    if not result:
        raise ValueError("Không tìm đuợc kết quả")

    session_obj = db.query(ExamSession).filter(ExamSession.id == result.session_id).first()
    if not session_obj:
        raise ValueError("Không tìm thấy đợt thi")

    if edit_data.get("student_code"):
        new_student_code = edit_data["student_code"].strip()
        result.student_code = new_student_code

        student = db.query(Student).filter(Student.id == result.student_id).first()
        result.student_id = student.id if student else None

    if edit_data.get("test_code"):
        # Nếu có mã đề mới, lấy đáp án mới
        new_test_code = edit_data["test_code"].strip()
        result.detected_test_code = new_test_code

        answer_key = db.query(AnswerKey).filter(
            AnswerKey.session_id == result.session_id,
            AnswerKey.test_code == new_test_code
        ).first()

        if not answer_key:
            raise ValueError(f"Mã đề '{new_test_code}' chưa có đáp án")

        correct_map = {int(k): v for k, v in answer_key.answers.items()}
        score_map = answer_key.score_per_question or {}
    else:
        # Giữ nguyên mã đề cũ, lấy đáp án từ database
        answer_key = db.query(AnswerKey).filter(
            AnswerKey.session_id == result.session_id,
            AnswerKey.test_code == result.detected_test_code
        ).first()

        if answer_key:
            correct_map = {int(k): v for k, v in answer_key.answers.items()}
            score_map = answer_key.score_per_question or {}

    total_q = len(correct_map) if correct_map else result.total_questions
    default_score = session_obj.max_score / total_q if total_q > 0 else 0.0

    manual_answers = edit_data.get("answers", {})
    current_answers = result.answers or {}

    correct_count = 0
    total_score = 0.0
    updated_answer = {}

    for q_idx in range(1, total_q + 1):
        str_q = str(q_idx)

        if str_q in manual_answers:
            student_ans = manual_answers[str_q]
        else:
            student_ans = current_answers.get(str_q, {}).get("choice")

        correct_ans = correct_map.get(q_idx)
        is_correct = (student_ans == correct_ans)
        q_score = float(score_map.get(str_q, default_score))

        if is_correct:
            correct_count += 1
            total_score += q_score

        updated_answer[str_q] = {
            "choice": student_ans,
            "is_correct": is_correct,
            "correct_answer": correct_ans,
            "earned_score": q_score if is_correct else 0.0,
            "max_score": q_score
        }

    result.answers = updated_answer
    result.correct_count = correct_count
    result.total_question = total_q
    result.score = round(total_score, 2)
    result.is_manual_override = True
    result.verified_by = verified_by
    result.updated_at = datetime.utcnow()
    result.status = "graded"

    db.commit()
    db.refresh(result)

    return {
        "result_id": result.id,
        "student_code": result.student_code,
        "test_code": result.test_code,
        "score": result.score,
        "is_manually_edited": result.is_manually_override,
        "message": "Cập nhât thành công"
    }

def get_result_list(
        session_id: int,
        db: Session,
        status_filter: str = "ALL",
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 50,
):
    batches = db.query(ScanBatch).filter(ScanBatch.session_id == session_id).all()

    all_images = []
    for batch in batches:
        if batch.scan_metadata and "images" in batch.scan_metadata:
            for img in batch.scan_metadata["images"]:
                img["batch_id"] = batch.id
                all_images.append(img)

    if not all_images:
        return {
            "summary": {
                "total_submitted": 0,
                "valid_count": 0,
                "warning_count": 0,
            },
            "items": []
        }

    success_results = db.query(StudentResult).filter(StudentResult.session_id == session_id).all()

    success_map = {}
    for r in success_results:
        if r.student_code and r.detected_test_code:
            key = f"{r.student_code}_{r.detected_test_code}"
            success_map[key] = r

    items = []
    valid_count = 0
    warning_count = 0

    for img in all_images:
        student_code = img.get("student_code")
        test_code = img.get("test_code")
        status_img = img.get("status", "pending")
        error = img.get("error")
        filename = img.get("filename", "unknown")

        key = f"{student_code}_{test_code}" if student_code and test_code else None
        result = success_map.get(key) if key else None

        if result:
            student = result.student if result.student_id else None
            result_status, warnings = get_result_status(result, student)

            if result_status == "VALID":
                valid_count += 1
            else:
                warning_count += 1

            items.append({
                "result_id": result.id,
                "image_url": result.processed_image_path or result.raw_image_path or f"/static/uploads/{filename}",
                "student_code": result.student_code,
                "student_name": result.full_name if student else None,
                "test_code": result.detected_test_code,
                "total_score": result.score,
                "status": result_status,
                "is_manually_edited": result.is_manually_override,
                "warnings": warnings,
                "batch_id": img.get("batch_id")
            })
        else:
            warnings = []
            if status_img == "failed" and error:
                warnings.append(error)
            else:
                if not student_code:
                    warnings.append("Không nhận diện đuợc Số báo danh")
                if not test_code:
                    warnings.append("Không nhận diện đuợc Mã đề")

            if not warnings:
                warnings.append("Bài thi chưa đuợc xử lý")

            warning_count += 1

            items.append({
                "result_id": None,
                "image_url": f"/static/uploads/{filename}",
                "student_code": student_code,
                "student_name": None,
                "test_code": test_code,
                "total_score": 0.0,
                "status": "NEED_REVIEW",
                "is_manually_edited": False,
                "warnings": warnings,
                "batch_id": img.get("batch_id")
            })

    if status_filter == "VALID_ONLY":
        items = [ item for item in items if item["status"] == "VALID"]
    elif status_filter == "WARNING_ONLY":
        items = [item for item in items if item["status"] == "WARNING"]

    if search:
        search_lower = search.lower()
        filtered_items = []
        for item in items:
            match = False
            if item["student_code"] and search_lower in item["student_code"].lower:
                match = True
            if item["student_name"] and search_lower in item["student_name"].lower():
                match = True
            if match:
                filtered_items.append(item)
        items = filtered_items

    total = len(items)
    start = (page - 1) * limit
    end = start + limit
    paged_items = items[start:end]

    return {
        "summary": {
            "total_submitted": total,
            "valid_count": valid_count,
            "warning_count": warning_count,
        },
        "items": paged_items
    }


# services/result_service.py
from sqlalchemy.orm import Session
from database.models import (
    StudentResult, Student, ExamSession, ScanBatch, AnswerKey, User
)
from typing import List, Optional, Dict
from datetime import datetime


def get_results_list(
        session_id: int,
        db: Session,
        status_filter: str = "ALL",
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 50
) -> dict:
    """
    Lấy danh sách kết quả FULL (bao gồm cả bài bị lỗi)
    """
    # === 1. Lấy tất cả ScanBatch của session này ===
    batches = db.query(ScanBatch).filter(ScanBatch.session_id == session_id).all()

    # === 2. Gom tất cả ảnh từ scan_metadata của các batch ===
    all_images = []
    for batch in batches:
        if batch.scan_metadata and "images" in batch.scan_metadata:
            for img in batch.scan_metadata["images"]:
                img["batch_id"] = batch.id
                all_images.append(img)

    # Nếu không có ảnh nào, trả về danh sách rỗng
    if not all_images:
        return {
            "summary": {
                "total_submitted": 0,
                "valid_count": 0,
                "warning_count": 0
            },
            "items": []
        }

    # === 3. Lấy tất cả StudentResult đã chấm thành công ===
    success_results = db.query(StudentResult).filter(
        StudentResult.session_id == session_id
    ).all()

    # Tạo dict để tra cứu nhanh: key = student_code + test_code
    success_map = {}
    for r in success_results:
        if r.student_code and r.detected_test_code:
            key = f"{r.student_code}_{r.detected_test_code}"
            success_map[key] = r

    # === 4. Ghép nối: Xây dựng danh sách items ===
    items = []
    valid_count = 0
    warning_count = 0

    for img in all_images:
        student_code = img.get("student_code")
        test_code = img.get("test_code")
        status_img = img.get("status", "pending")
        error = img.get("error")
        filename = img.get("filename", "unknown")

        # Tìm trong success_map
        key = f"{student_code}_{test_code}" if student_code and test_code else None
        result = success_map.get(key) if key else None

        if result:
            # === CÓ KẾT QUẢ ===
            student = result.student if result.student_id else None

            # Xác định trạng thái
            result_status, warnings = get_result_status(result, student)

            if result_status == "VALID":
                valid_count += 1
            else:
                warning_count += 1

            items.append({
                "result_id": result.id,
                "image_url": result.processed_image_path or result.raw_image_path or f"/static/uploads/{filename}",
                "student_code": result.student_code,
                "student_name": student.full_name if student else None,
                "test_code": result.detected_test_code,
                "total_score": result.score,
                "status": result_status,
                "is_manually_edited": result.is_manual_override,
                "warnings": warnings,
                "batch_id": img.get("batch_id")
            })
        else:
            # === KHÔNG CÓ KẾT QUẢ (bài bị lỗi) ===
            warnings = []

            if status_img == "failed" and error:
                warnings.append(error)
            else:
                if not student_code:
                    warnings.append("Không nhận diện được Số báo danh")
                if not test_code:
                    warnings.append("Không nhận diện được Mã đề")

            if not warnings:
                warnings.append("Bài thi chưa được xử lý")

            warning_count += 1

            items.append({
                "result_id": None,
                "image_url": f"/static/uploads/{filename}",
                "student_code": student_code,
                "student_name": None,
                "test_code": test_code,
                "total_score": 0.0,
                "status": "NEED_REVIEW",
                "is_manually_edited": False,
                "warnings": warnings,
                "batch_id": img.get("batch_id")
            })

    # === 5. Lọc theo status_filter ===
    if status_filter == "VALID_ONLY":
        items = [item for item in items if item["status"] == "VALID"]
    elif status_filter == "WARNING_ONLY":
        items = [item for item in items if item["status"] != "VALID"]

    # === 6. Tìm kiếm theo SBD hoặc tên ===
    if search:
        search_lower = search.lower()
        filtered_items = []
        for item in items:
            match = False
            if item["student_code"] and search_lower in item["student_code"].lower():
                match = True
            if item["student_name"] and search_lower in item["student_name"].lower():
                match = True
            if match:
                filtered_items.append(item)
        items = filtered_items

    # === 7. Phân trang ===
    total = len(items)
    start = (page - 1) * limit
    end = start + limit
    paged_items = items[start:end]

    return {
        "summary": {
            "total_submitted": total,
            "valid_count": valid_count,
            "warning_count": warning_count
        },
        "items": paged_items
    }


def get_result_detail(
        result_id: int,
        db: Session
) -> dict:
    """Lấy chi tiết 1 bài thi (cho split-screen)"""

    result = db.query(StudentResult).filter(
        StudentResult.id == result_id
    ).first()

    if not result:
        raise ValueError("Không tìm thấy kết quả")

    student = result.student if result.student_id else None

    # Xác định status
    status, _ = get_result_status(result, student)

    # Parse chi tiết câu hỏi
    questions = []
    if result.answers:
        for q_num, q_data in result.answers.items():
            questions.append({
                "question_number": int(q_num),
                "student_answer": q_data.get("choice"),
                "correct_answer": q_data.get("correct_answer"),
                "is_correct": q_data.get("is_correct", False),
                "earned_score": q_data.get("earned_score", 0.0),
                "max_score": q_data.get("max_score", 0.0)
            })

    # Sắp xếp theo số câu
    questions.sort(key=lambda x: x["question_number"])

    return {
        "result_id": result.id,
        "image_url": result.processed_image_path or result.raw_image_path,
        "student_code": result.student_code,
        "student_name": student.full_name if student else None,
        "test_code": result.detected_test_code,
        "total_score": result.score,
        "status": status,
        "is_manually_edited": result.is_manual_override,
        "questions": questions
    }


def manual_edit_result(
        result_id: int,
        edit_data: dict,
        db: Session,
        verified_by: int
) -> dict:
    """Giáo viên chỉnh sửa tay và tính lại điểm"""

    result = db.query(StudentResult).filter(
        StudentResult.id == result_id
    ).first()

    if not result:
        raise ValueError("Không tìm thấy kết quả")

    session_obj = db.query(ExamSession).filter(
        ExamSession.id == result.session_id
    ).first()

    if not session_obj:
        raise ValueError("Không tìm thấy đợt thi")

    # === 1. Cập nhật SBD mới ===
    if edit_data.get("student_code"):
        new_student_code = edit_data["student_code"].strip()
        result.student_code = new_student_code

        # Tìm student trong database
        student = db.query(Student).filter(
            Student.session_id == result.session_id,
            Student.student_code == new_student_code
        ).first()

        result.student_id = student.id if student else None

    # === 2. Cập nhật Mã đề mới ===
    if edit_data.get("test_code"):
        new_test_code = edit_data["test_code"].strip()
        result.detected_test_code = new_test_code

        # Lấy đáp án mới
        answer_key = db.query(AnswerKey).filter(
            AnswerKey.session_id == result.session_id,
            AnswerKey.test_code == new_test_code
        ).first()

        if not answer_key:
            raise ValueError(f"Mã đề '{new_test_code}' chưa có đáp án")

        # Lưu đáp án đúng để tính điểm
        correct_map = {int(k): v for k, v in answer_key.answers.items()}
        score_map = answer_key.score_per_question or {}
        result._correct_answers_map = correct_map
        result._score_map = score_map

    # === 3. Cập nhật đáp án thủ công ===
    if edit_data.get("answers"):
        manual_answers = edit_data["answers"]
        result.manual_answers = manual_answers
        result.is_manual_override = True

        # Lấy đáp án đúng
        correct_map = getattr(result, '_correct_answers_map', None)
        if not correct_map:
            answer_key = db.query(AnswerKey).filter(
                AnswerKey.session_id == result.session_id,
                AnswerKey.test_code == result.detected_test_code
            ).first()
            if answer_key:
                correct_map = {int(k): v for k, v in answer_key.answers.items()}
                score_map = answer_key.score_per_question or {}
            else:
                correct_map = {}
                score_map = {}

        # Tính lại điểm
        total_q = len(correct_map) if correct_map else result.total_questions
        default_score = session_obj.max_score / total_q if total_q > 0 else 0.0

        correct_count = 0
        total_score = 0.0
        updated_answers = {}

        current_answers = result.answers or {}

        for q_idx in range(1, total_q + 1):
            str_q = str(q_idx)

            # Dùng đáp án thủ công nếu có
            if str_q in manual_answers:
                student_ans = manual_answers[str_q]
            else:
                student_ans = current_answers.get(str_q, {}).get("choice")

            correct_ans = correct_map.get(q_idx)
            is_correct = (student_ans == correct_ans)
            q_score = float(score_map.get(str_q, default_score))

            if is_correct:
                correct_count += 1
                total_score += q_score

            updated_answers[str_q] = {
                "choice": student_ans,
                "is_correct": is_correct,
                "correct_answer": correct_ans,
                "earned_score": q_score if is_correct else 0.0,
                "max_score": q_score
            }

        result.answers = updated_answers
        result.correct_count = correct_count
        result.total_questions = total_q
        result.score = round(total_score, 2)

    # === 4. Cập nhật scan_metadata ===
    result.is_manual_override = True
    result.verified_by = verified_by
    result.updated_at = datetime.utcnow()
    result.status = "graded"

    db.commit()
    db.refresh(result)

    return {
        "result_id": result.id,
        "student_code": result.student_code,
        "test_code": result.detected_test_code,
        "score": result.score,
        "is_manually_edited": result.is_manual_override,
        "message": "Cập nhật thành công"
    }


def get_result_status(result, student):
    """Xác định trạng thái của bài thi"""
    warnings = []
    status = "VALID"

    if not result.student_code:
        warnings.append("Không nhận diện được Số báo danh")
        status = "NEED_REVIEW"

    if not result.detected_test_code:
        warnings.append("Không nhận diện được Mã đề")
        status = "NEED_REVIEW"

    if not student:
        warnings.append("Không tìm thấy SBD trong danh sách đợt thi")
        status = "NEED_REVIEW"

    if result.status == "error":
        warnings.append("AI không nhận diện được khung bài thi")
        status = "NEED_REVIEW"

    return status, warnings