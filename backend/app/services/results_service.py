import os

import cv2
from sqlalchemy.orm import Session
from database.models import StudentResult, Student, ExamSession, AnswerKey, ScanBatch
from typing import List, Optional, Dict
from datetime import datetime

from services.pipeline import process_and_draw_result
from services.process_ans import find_answer_blocks, process_ans_blocks, process_list_ans, get_answers
from services.process_id import process_id
from services.process_img import warp_process

BASE_URL = "http://localhost:8000"

def build_full_url(path: Optional[str]) -> Optional[str]:
    if not path:
        return None
    if path.startswith("http://") or path.startswith("https://"):
        return path

    # Chuẩn hóa đường dẫn: loại bỏ dấu / ở đầu để không bị thừa khi ghép link
    clean_path = path.lstrip("/")
    return f"{BASE_URL}/{clean_path}"

def get_result_detail(
        result_id: int,
        db: Session,
):
    result = db.query(StudentResult).filter(StudentResult.id == result_id).first()
    if not result:
        raise ValueError("Không tìm thấy kết quả")

    student = result.student if result.student_id else None

    status, _ = get_result_status(result, student)

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
        "raw_url": result.raw_image_path,
        "image_url": result.processed_image_path,
        "student_code": result.student_code,
        "student_name": student.full_name if student else None,
        "test_code": result.detected_test_code,
        "total_score": result.score,
        "status": status,
        "is_manual_override": result.is_manual_override,
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
        raise ValueError("Không tìm thấy kết quả")

    session_obj = db.query(ExamSession).filter(ExamSession.id == result.session_id).first()
    if not session_obj:
        raise ValueError("Không tìm thấy đợt thi")

    # 1. Cập nhật thông tin text SBD và Mã đề từ giáo viên nhập vào đối tượng DB trước
    if edit_data.get("student_code"):
        new_student_code = edit_data["student_code"].strip()
        result.student_code = new_student_code

        student = db.query(Student).filter(
            Student.session_id == result.session_id,
            Student.student_code == new_student_code
        ).first()
        result.student_id = student.id if student else None

    if edit_data.get("test_code"):
        result.detected_test_code = edit_data["test_code"].strip()

    # 2. Lấy đáp án mẫu chuẩn theo Mã đề MỚI vừa cập nhật
    answer_key = db.query(AnswerKey).filter(
        AnswerKey.session_id == result.session_id,
        AnswerKey.test_code == result.detected_test_code
    ).first()

    correct_map = {int(k): v for k, v in answer_key.answers.items()} if answer_key else {}
    score_map = answer_key.score_per_question or {} if answer_key else {}

    total_q = len(correct_map) if correct_map else (result.total_questions or 0)
    default_score = session_obj.max_score / total_q if total_q > 0 else 0.0

    manual_answers = edit_data.get("answers", {})

    # Khởi tạo các cấu trúc dữ liệu phục vụ xử lý ảnh
    warped_img = None
    ai_detected_results = {}
    id_results_updated = {}  # Cấu trúc lưu thông tin SBD/Mã đề cập nhật để truyền vào hàm vẽ

    # 3. XỬ LÝ ẢNH: QUÉT TOÀN BỘ TỌA ĐỘ HÌNH HỌC (Cả đáp án và SBD/Mã đề)
    if result.raw_image_path:
        APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        raw_relative_path = result.raw_image_path.replace("/static/", "storage/").lstrip("/")
        source_raw_path = os.path.normpath(os.path.join(APP_DIR, raw_relative_path))

        if os.path.exists(source_raw_path):
            try:
                print(f"Tìm thấy ảnh gốc, bắt đầu tái tạo tọa độ...")
                warped_img = warp_process(source_raw_path)

                # A. Quét tọa độ của vùng Đáp án trắc nghiệm
                ans_blocks_data = find_answer_blocks(warped_img)
                list_ans = process_ans_blocks(ans_blocks_data)
                list_choices = process_list_ans(list_ans)

                ai_detected_results = get_answers(list_choices, threshold=0.8)

                # B. Quét tọa độ của vùng SBD và Mã đề từ file bạn vừa gửi
                ai_id_geometry = process_id(warped_img)

                # C. Đồng bộ hóa Số báo danh mới (Giao viên sửa tay) vào tọa độ hình học
                if "student_id" in ai_id_geometry and result.student_code:
                    sbd_str = result.student_code.zfill(6)  # Đảm bảo đủ chiều dài cột SBD (ví dụ 6 số)
                    raw_sbd_geometry = ai_id_geometry["student_id"]

                    id_results_updated["student_id"] = {}
                    for col_idx, col_data in raw_sbd_geometry.items():
                        char_pos = col_idx - 1
                        assigned_digit = sbd_str[char_pos] if char_pos < len(sbd_str) else None

                        id_results_updated["student_id"][col_idx] = {
                            "answer": assigned_digit,  # Đè đáp án sửa tay vào đây để hàm vẽ khoanh ô này
                            "ratio": 1.0,
                            "details": col_data.get("details", {}),
                            "geometry": col_data.get("geometry", {})
                        }

                # D. Đồng bộ hóa Mã đề mới (Giáo viên sửa tay) vào tọa độ hình học
                if "exam_id" in ai_id_geometry and result.detected_test_code:
                    md_str = result.detected_test_code.zfill(3)  # Đảm bảo đủ 3 cột mã đề
                    raw_md_geometry = ai_id_geometry["exam_id"]

                    id_results_updated["exam_id"] = {}
                    for col_idx, col_data in raw_md_geometry.items():
                        char_pos = col_idx - 1
                        assigned_digit = md_str[char_pos] if char_pos < len(md_str) else None

                        id_results_updated["exam_id"][col_idx] = {
                            "answer": assigned_digit,  # Đè mã đề sửa tay vào đây để hàm vẽ khoanh ô này
                            "ratio": 1.0,
                            "details": col_data.get("details", {}),
                            "geometry": col_data.get("geometry", {})
                        }

                #print("Đồng bộ hóa tọa độ hình học SBD/Mã đề mới thành công!")

            except Exception as img_err:
                import traceback
                print(f"Lỗi trích xuất tọa độ từ hình ảnh: {str(img_err)}")
                traceback.print_exc()

    # 4. CHẤM ĐIỂM VÀ ĐÓNG GÓI DỮ LIỆU ĐÁP ÁN (Dựa trên đáp án mẫu của Mã đề MỚI)
    correct_count = 0
    total_score = 0.0
    updated_answers = {}
    current_answers = result.answers or {}

    all_q_keys = set(current_answers.keys()) | set(ai_detected_results.keys())
    max_questions = max([int(k) for k in all_q_keys if str(k).isdigit()] + [104])

    for q_idx in range(1, max_questions + 1):
        str_q = str(q_idx)

        if str_q in manual_answers or q_idx in manual_answers:
            student_ans = manual_answers.get(str_q, manual_answers.get(q_idx))
        elif str_q in current_answers:
            student_ans = current_answers[str_q].get("choice")
        else:
            student_ans = ai_detected_results.get(q_idx, {}).get("answer")

        ai_q_data = ai_detected_results.get(q_idx, {})
        valid_geometry = ai_q_data.get("geometry") or current_answers.get(str_q, {}).get("geometry", {})

        # Tiến hành chấm điểm nếu câu nằm trong phạm vi mã đề
        if q_idx <= total_q:
            correct_ans = correct_map.get(q_idx)
            is_correct = (student_ans == correct_ans) if (student_ans and correct_ans) else False
            q_score = float(score_map.get(str_q, score_map.get(q_idx, default_score)))

            if is_correct:
                correct_count += 1
                total_score += q_score

            earned_score = q_score if is_correct else 0.0
            max_score = q_score
        else:
            # Câu ngoài phạm vi mã đề -> Giữ lại geometry nhưng không tính điểm
            correct_ans = None
            is_correct = False
            earned_score = 0.0
            max_score = 0.0

        updated_answers[str_q] = {
            "choice": student_ans,
            "answer": student_ans,
            "is_correct": is_correct,
            "correct_answer": correct_ans,
            "earned_score": earned_score,
            "max_score": max_score,
            "geometry": valid_geometry
        }

    # Lưu kết quả chấm mới vào DB
    result.answers = updated_answers
    result.correct_count = correct_count
    result.total_questions = total_q
    result.score = round(total_score, 2)
    result.is_manual_override = True
    result.verified_by = verified_by
    result.updated_at = datetime.utcnow()
    result.status = "graded"

    # 5. TIẾN HÀNH VẼ ĐÈ LÊN ẢNH KẾT QUẢ VỚI ĐÁP ÁN VÀ SBD/MÃ ĐỀ MỚI
    if warped_img is not None and updated_answers:
        try:
            new_processed_img = process_and_draw_result(
                warped_img=warped_img,
                results=updated_answers,
                answers_key=correct_map,
                id_results=id_results_updated
            )

            if new_processed_img is not None:
                # LUÔN LUÔN bốc từ raw_image_path để sinh tên file chuẩn, tránh lấy lại path lỗi cũ trong DB
                raw_filename = os.path.basename(result.raw_image_path)

                # Biến đổi chuẩn xác từ raw_ -> processed_
                if raw_filename.startswith("raw_"):
                    processed_filename = raw_filename.replace("raw_", "processed_", 1)
                else:
                    processed_filename = f"processed_{raw_filename}"

                # Cập nhật lại URL chuẩn vào Database (Ghi đè hoàn toàn URL lỗi nếu có)
                processed_url = f"/static/processed/{processed_filename}"
                result.processed_image_path = processed_url

                # Quy đổi URL tĩnh thành đường dẫn đĩa vật lý
                processed_relative_path = processed_url.replace("/static/", "storage/").lstrip("/")
                target_write_path = os.path.normpath(os.path.join(APP_DIR, processed_relative_path))

                # Thực hiện ghi đè dữ liệu ảnh mới trực tiếp lên file chuẩn
                os.makedirs(os.path.dirname(target_write_path), exist_ok=True)
                cv2.imwrite(target_write_path, new_processed_img)
                #print(f"Đã ghi đè hình ảnh thành công vào file chuẩn: {target_write_path}")

        except Exception as draw_err:
            print(f"❌ Lỗi kết xuất hình ảnh: {str(draw_err)}")

    db.commit()
    db.refresh(result)

    return {
        "result_id": result.id,
        "student_code": result.student_code,
        "test_code": result.detected_test_code,
        "score": result.score,
        "is_manually_edited": result.is_manual_override,
        "image_url": result.processed_image_path or result.raw_image_path,
        "message": "Cập nhật dữ liệu, chấm lại và vẽ lại hình ảnh thành công!"
    }


def get_result_list(
        session_id: int,
        db: Session,
        status_filter: str = "ALL",
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 50,
) -> dict:

    query = db.query(StudentResult).filter(StudentResult.session_id == session_id)

    all_results = query.all()
    total_submitted = len(all_results)
    valid_count = 0
    warning_count = 0

    items = []
    for r in all_results:
        student = r.student if r.student_id else None
        result_status, warnings = get_result_status(r, student)

        if result_status == "VALID":
            valid_count += 1
        else:
            warning_count += 1

        raw_path = r.raw_image_path
        image_path = r.processed_image_path or r.raw_image_path

        item = {
            "result_id": r.id,  # Luôn có ID vì bài lỗi cũng đã có record Draft
            "raw_url": build_full_url(raw_path),
            "image_url": build_full_url(image_path),
            "student_code": r.student_code,
            "student_name": student.full_name if student else None,
            "test_code": r.detected_test_code,
            "total_score": r.score or 0.0,
            "status": result_status,
            "is_manually_edited": r.is_manual_override,
            "warnings": warnings,
            "batch_id": r.batch_id if hasattr(r, 'batch_id') else None
        }
        items.append(item)

    # 3. Bộ lọc theo status_filter
    if status_filter == "VALID_ONLY":
        items = [i for i in items if i["status"] == "VALID"]
    elif status_filter == "WARNING_ONLY":
        items = [i for i in items if i["status"] != "VALID"]

    # 4. Tìm kiếm theo SBD hoặc Tên học sinh
    if search:
        search_lower = search.lower()
        items = [
            i for i in items
            if (i["student_code"] and search_lower in i["student_code"].lower()) or
               (i["student_name"] and search_lower in i["student_name"].lower())
        ]

    # 5. Phân trang
    total = len(items)
    start = (page - 1) * limit
    paged_items = items[start:start + limit]

    return {
        "summary": {
            "total_submitted": total_submitted,
            "valid_count": valid_count,
            "warning_count": warning_count,
        },
        "items": paged_items
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