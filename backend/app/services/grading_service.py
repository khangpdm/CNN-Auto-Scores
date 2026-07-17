import os
import uuid
import cv2
import numpy as np
from datetime import datetime
from sqlalchemy.orm import Session
import traceback  # ✅ Thêm import này
from sqlalchemy.orm.attributes import flag_modified

from database.models import AnswerKey, ExamSession, ScanBatch, Student, StudentResult
from database.connection import SessionLocal
from services.pipeline import core_processing_pipeline, process_and_draw_result

UPLOAD_DIR = "storage/uploads"
PROCESSED_DIR = "storage/processed"

def build_return_dict(result_entry: StudentResult, student_name: str, message: str):
    """Hàm helper dựng kết quả trả về đồng nhất"""
    return {
        "id": result_entry.id,
        "student_code": result_entry.student_code,
        "test_code": result_entry.detected_test_code,
        "student_name": student_name,
        "score": result_entry.score,
        "correct_count": f"{result_entry.correct_count}/{result_entry.total_questions}",
        "raw_image_url": result_entry.raw_image_path,
        "processed_image_url": result_entry.processed_image_path,
        "status": result_entry.status,
        "warnings": result_entry.warnings,
        "message": message
    }

def process_single_image(
        img_bytes: bytes,
        session_obj: ExamSession,
        batch_id: int,
        db: Session,
):

    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    unique_filename = f"{uuid.uuid4().hex}_{int(datetime.utcnow().timestamp())}"
    raw_file_name = f"raw_{unique_filename}.jpg"
    raw_file_path = os.path.join(UPLOAD_DIR, raw_file_name)
    with open(raw_file_path, "wb") as f:
        f.write(img_bytes)

    result_entry = StudentResult(
        exam_id=session_obj.exam_id,
        session_id=session_obj.id,
        scan_batch_id=batch_id,
        student_id=None,
        student_code=None,
        detected_test_code=None,
        raw_image_path=f"/static/uploads/{raw_file_name}",
        processed_image_path=None,
        overlay_image_path=None,
        answers={},
        correct_count=0,
        total_questions=0,
        score=0.0,
        status="NEED_REVIEW",  # Mặc định là cần review nếu có lỗi xảy ra giữa chừng
        warnings=[],
        is_manual_override=False,
        scanned_at=datetime.utcnow()
    )
    db.add(result_entry)
    db.commit()
    db.refresh(result_entry)

    current_warnings = []

    if img is None:
        result_entry.status = "FAILED"
        result_entry.warnings = ["File ảnh bị hỏng hoặc không hợp lệ"]
        flag_modified(result_entry, "warnings")
        db.commit()
        return build_return_dict(result_entry, "Không rõ", "File ảnh hỏng")

    try:
        warped_img, id_results, ans_results = core_processing_pipeline(img)
    except Exception as e:
        result_entry.status = "FAILED"
        result_entry.warnings = [f"Lỗi hệ thống AI: {str(e)}"]

    if warped_img is None or not ans_results:
        result_entry.status = "NEED_REVIEW"
        result_entry.warnings = ["AI không nhận diện được khung bài thi"]
        flag_modified(result_entry, "warnings")
        db.commit()
        return build_return_dict(result_entry, "Không rõ", "Lỗi định vị bài")

    sbd_str = "".join([
        id_results.get("student_id", {}).get(i, {}).get("answer") or ""
        for i in sorted(id_results.get("student_id", {}).keys())
    ])
    detected_test_code = "".join([
        id_results.get("exam_id", {}).get(i, {}).get("answer") or ""
        for i in sorted(id_results.get("exam_id", {}).keys())
    ])

    if not sbd_str:
        current_warnings.append("Không nhận diện được Số báo danh")
    else:
        result_entry.student_code = sbd_str
        # Tìm học sinh tương ứng
        student_obj = db.query(Student).filter(
            Student.session_id == session_obj.id,
            Student.student_code == sbd_str
        ).first()
        if student_obj:
            result_entry.student_id = student_obj.id
        else:
            current_warnings.append(f"Không tìm thấy học sinh có SBD '{sbd_str}' trong danh sách đợt thi")

    if not detected_test_code:
        current_warnings.append("Không nhận diện được Mã đề")
    else:
        result_entry.detected_test_code = detected_test_code

    answer_key_obj = None
    if detected_test_code:
        answer_key_obj = db.query(AnswerKey).filter(
            AnswerKey.session_id == session_obj.id,
            AnswerKey.test_code == detected_test_code
        ).first()

    correct_answers_map = {}
    if answer_key_obj:
        correct_answers_map = {int(k): v for k, v in answer_key_obj.answers.items()}
    else:
        current_warnings.append(f"Chưa cấu hình bộ đáp án hoặc thiếu mã đề cho bài này. Điểm tạm thời tính bằng 0.")

    processed_file_name = f"processed_{unique_filename}.jpg"
    processed_file_path = os.path.join(PROCESSED_DIR, processed_file_name)
    try:
        processed_img = process_and_draw_result(warped_img, ans_results, correct_answers_map, id_results)
        cv2.imwrite(processed_file_path, processed_img)
        result_entry.processed_image_path = f"/static/processed/{processed_file_name}"
    except Exception as e:
        current_warnings.append(f"Không thể vẽ ảnh kết quả chấm: {str(e)}")

    total_q = len(correct_answers_map)
    user_answers_dict = {}
    correct_q = 0
    calculated_score = 0.0

    # Kiểm tra an toàn xem thuộc tính json score_per_question có hợp lệ không
    score_per_q_map = {}
    if answer_key_obj and answer_key_obj.score_per_question:
        score_per_q_map = answer_key_obj.score_per_question

    default_score_per_q = (session_obj.max_score / total_q) if total_q > 0 else 0.0

    for q_idx, user_ans_info in ans_results.items():
        ans_val = user_ans_info.get("answer")

        # Nếu không có bộ đáp án mẫu, mặc định tất cả các câu đều tính là Sai
        correct_ans = correct_answers_map.get(q_idx) if correct_answers_map else None
        is_correct = (ans_val == correct_ans) if correct_ans is not None else False

        # Tránh lỗi ép kiểu float nếu dữ liệu cấu hình bị rỗng
        try:
            q_score_weight = float(score_per_q_map.get(str(q_idx), default_score_per_q))
        except (ValueError, TypeError, AttributeError):
            q_score_weight = default_score_per_q

        if is_correct:
            correct_q += 1
            calculated_score += q_score_weight

        user_answers_dict[str(q_idx)] = {
            "choice": ans_val,
            "is_correct": is_correct,
            "correct_answer": correct_ans,
            "earned_score": q_score_weight if is_correct else 0.0,
            "max_score": q_score_weight,
        }

    calculated_score = round(calculated_score, 2) if total_q > 0 else 0.0

    result_entry.answers = user_answers_dict
    result_entry.correct_count = correct_q
    result_entry.total_questions = total_q
    result_entry.score = calculated_score
    result_entry.graded_at = datetime.utcnow()

    if current_warnings:
        result_entry.status = "NEED_REVIEW"
        result_entry.warnings = current_warnings
    else:
        result_entry.status = "graded"
        result_entry.warnings = []

    flag_modified(result_entry, "answers")
    flag_modified(result_entry, "warnings")
    db.commit()

    student_name = student_obj.full_name if 'student_obj' in locals() and student_obj else "Chưa rõ"
    return build_return_dict(result_entry, student_name, "Thành công")


def process_files_background(
        files_data: list,
        session_id: int,
        batch_id: int,
):
    bg_db = SessionLocal()

    try:
        session_obj = bg_db.query(ExamSession).filter(
            ExamSession.id == session_id
        ).first()
        if not session_obj:
            print(f"❌ Không tìm thấy session {session_id}")
            return

        success = 0
        failed = 0
        total = len(files_data)
        errors = []

        # Lấy batch và khởi tạo scan_metadata
        batch = bg_db.query(ScanBatch).filter(ScanBatch.id == batch_id).first()
        if batch:
            batch.total_scanned = total
            batch.scan_metadata = {
                "total_images": total,
                "processed": 0,
                "errors": [],
                "images": [
                    {
                        "index": idx,
                        "filename": f"image_{idx + 1}.jpg",
                        "status": "pending",
                        "student_code": None,
                        "test_code": None,
                        "score": None,
                        "error": None
                    }
                    for idx in range(total)
                ]
            }
            bg_db.commit()
            bg_db.refresh(batch)  # ✅ Refresh để batch có dữ liệu mới nhất

        # Xử lý từng ảnh
        for idx, img_bytes in enumerate(files_data):
            try:
                result = process_single_image(img_bytes, session_obj, batch_id, bg_db)
                success += 1

                # ✅ Query lại batch mới nhất và cập nhật
                batch = bg_db.query(ScanBatch).filter(ScanBatch.id == batch_id).first()
                if batch and batch.scan_metadata and "images" in batch.scan_metadata:
                    if idx < len(batch.scan_metadata["images"]):
                        batch.scan_metadata["images"][idx]["status"] = "completed"
                        batch.scan_metadata["images"][idx]["student_code"] = result.get("student_code")
                        batch.scan_metadata["images"][idx]["test_code"] = result.get("test_code")
                        batch.scan_metadata["images"][idx]["score"] = result.get("score")

                        # ✅ Ép SQLAlchemy nhận diện sự thay đổi trong dict JSON
                        flag_modified(batch, "scan_metadata")

                        bg_db.commit()
                        bg_db.refresh(batch)  # ✅ Refresh để cập nhật
                        print(f"    ✅ Đã cập nhật metadata cho ảnh {idx + 1}")

            except Exception as e:
                failed += 1
                error_msg = str(e)
                errors.append({"index": idx, "error": error_msg})
                print(f"❌ Ảnh {idx + 1} thất bại: {error_msg}")
                traceback.print_exc()

                # ✅ Query lại batch mới nhất và cập nhật lỗi
                batch = bg_db.query(ScanBatch).filter(ScanBatch.id == batch_id).first()
                if batch and batch.scan_metadata and "images" in batch.scan_metadata:
                    if idx < len(batch.scan_metadata["images"]):
                        batch.scan_metadata["images"][idx]["status"] = "failed"
                        batch.scan_metadata["images"][idx]["error"] = error_msg

                        # ✅ Ép SQLAlchemy nhận diện sự thay đổi trong dict JSON khi lỗi
                        flag_modified(batch, "scan_metadata")

                        bg_db.commit()
                        bg_db.refresh(batch)

            # Cập nhật tiến độ mỗi 3 ảnh hoặc ảnh cuối cùng
            if (idx + 1) % 3 == 0 or idx == total - 1:
                batch = bg_db.query(ScanBatch).filter(ScanBatch.id == batch_id).first()
                if batch:
                    batch.successful_scans = success
                    batch.failed_scans = failed
                    if batch.scan_metadata is None:
                        batch.scan_metadata = {}
                    batch.scan_metadata["processed"] = success + failed
                    batch.scan_metadata["errors"] = errors

                    # ✅ Đánh dấu có thay đổi
                    flag_modified(batch, "scan_metadata")

                    bg_db.commit()

        # Đánh dấu hoàn thành
        batch = bg_db.query(ScanBatch).filter(ScanBatch.id == batch_id).first()
        if batch:
            batch.status = "completed" if failed == 0 else "partial"
            batch.processing_time = (datetime.utcnow() - batch.scan_time).total_seconds()
            if batch.scan_metadata is None:
                batch.scan_metadata = {}
            batch.scan_metadata["errors"] = errors

            # ✅ Đánh dấu thay đổi lần cuối
            flag_modified(batch, "scan_metadata")

            bg_db.commit()
            bg_db.refresh(batch)

    except Exception as e:
        traceback.print_exc()
        batch = bg_db.query(ScanBatch).filter(ScanBatch.id == batch_id).first()
        if batch:
            batch.status = "failed"
            batch.scan_metadata = {"error": str(e)}

            # ✅ Đánh dấu thay đổi khi gặp Exception tổng
            flag_modified(batch, "scan_metadata")

            bg_db.commit()
    finally:
        bg_db.close()