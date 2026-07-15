import pandas as pd
from io import BytesIO
from sqlalchemy.orm import Session
from datetime import datetime
from database.models import AnswerKey, ExamSession, Student
from database.connection import SessionLocal

def parse_and_save_student_from_excel(
        excel_bytes: bytes,
        session_id: int,
        created_by: int,
        db: Session
) -> dict:
    try:
        df = pd.read_excel(BytesIO(excel_bytes), dtype=str)
    except Exception as e:
        raise ValueError(f"Không thể đọc file Excel: {str(e)}")

    required_columns = ["Họ và tên", "Số báo danh"]
    missing_cols = [col for col in required_columns if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Thiếu các cột bắt buộc: {', '.join(missing_cols)}")

    results = {
        "total": len(df),
        "success": 0,
        "errors": [],
        "students": []
    }

    for index, row in df.iterrows():
        try:
            full_name = str(row.get("Họ và tên", "")).strip()
            student_code = str(row.get("Số báo danh", "")).strip()
            room = str(row.get("Phòng thi", "")).strip()
            note = str(row.get("Ghi chú", "")).strip()
            class_name = str(row.get("Lớp", "")).strip()
            gender = str(row.get("Giới tính", "")).strip()
            if not full_name or not student_code:
                continue

            existing = db.query(Student).filter(
                Student.session_id == session_id,
                Student.student_code == student_code
            ).first()
            if existing:
                results["errors"].append({
                    "row": index + 2,
                    "student_code": student_code,
                    "error": f"SBD '{student_code}' đã tồn tại trong đợt thi này"
                })
                continue
            dob = None
            if pd.notna(row.get("Ngày sinh")):
                try:
                    dob = pd.to_datetime(row.get("Ngày sinh")).to_pydatetime()
                except:
                    dob = None

            student = Student(
                session_id = session_id,
                created_by = created_by,
                student_code = student_code,
                full_name = full_name,
                room=room,
                dob=dob,
                class_name = class_name,
                note = note,
                gender = gender
            )

            db.add(student)
            results["success"] += 1
            results["students"].append({
                "student_code": student_code,
                "full_name": full_name,
                "room": room,
                "dob": dob,
                "class_name": class_name,
                "note": note,
                "gender": gender
            })
        except Exception as e:
            results["errors"].append({
                "row": index + 2,
                "student_code": row.get("Số báo danh", "Unknown"),
                "error": str(e),
            })
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise ValueError(f"Lỗi khi lưu vào database: {str(e)}")

    return results

def parse_and_save_answer_to_db(
        excel_bytes: bytes,
        exam_id: int,
        session_id: int,
        created_by: int,
        db: Session
):
    try:
        df = pd.read_excel(BytesIO(excel_bytes), header=None)
    except Exception as e:
        raise ValueError("File Excel không đúng định dạng")

    if len(df) < 3:
        raise ValueError("File Excel không đúng định dạng (cần ít nhất 3 hàng)")

    question_numbers = []
    for col in range(1, len(df.columns)):
        val = df.iloc[1, col]
        if pd.notna(val):
            try:
                q_num = str(int(val))
                question_numbers.append(q_num)
            except (ValueError, TypeError):
                continue
    if not question_numbers:
        raise ValueError("Không tìm thấy số thứ tự câu hỏi ở hàng hợp lệ")

    score_per_question={}
    has_custom_scores=False

    second_row_val = str(df.iloc[2,0]).strip().lower() if pd.notna(df.iloc[2,0]) else ""
    is_score_row = second_row_val in ["điểm", "diem", "score", "point"]

    if is_score_row:
        for i,q_num in enumerate(question_numbers, start = 1):
            if i < len(df.columns):
                val = df.iloc[2,i]
                if pd.notna(val):
                    try:
                        score = float(val)
                        if score > 0:
                            score_per_question[q_num] = score
                            has_custom_scores = True
                    except (ValueError, TypeError):
                        continue

    max_question = 0
    for index in range(3,len(df)):
        row = df.iloc[index]
        for i in range(1,len(row)):
            if pd.notna(row[i]) and str(row[i]).strip():
                if i > max_question:
                    max_question = i

    actual_questions = min(len(question_numbers), max_question)
    if actual_questions == 0:
        raise ValueError("Không tim thấy dữ liệu đáp án hợp lệ")

    active_questions = question_numbers[:actual_questions]

    if not has_custom_scores:
        default_score = 10.0 / len(active_questions)
        for q_num in active_questions:
            score_per_question[q_num] = round (default_score, 2)

    session = db.query(ExamSession).filter(ExamSession.id == session_id).first()
    if session:
        session.total_questions = len(active_questions)
        db.commit()

    saved_test_codes = []

    for index in range(3,len(df)):
        row = df.iloc[index]

        test_code = str(row[0]).strip()
        if not test_code or test_code == "nan" or test_code == "None":
            continue

        answers = {}
        for i, q_num in enumerate(active_questions, start = 1):
            if i < len(row):
                ans = row[i]
                if pd.notna(ans) and str(ans).strip():
                    answers[q_num] = str(ans).strip().upper()

        if not answers:
            continue

        existing = db.query(AnswerKey).filter(
            AnswerKey.session_id == session_id,
            AnswerKey.test_code == test_code
        ).first()

        if existing:
            existing.answers = answers
            existing.score_per_question = score_per_question
            existing.updated_at = datetime.utcnow()

        else:
            new_answer_key = AnswerKey(
                exam_id = exam_id,
                session_id = session_id,
                test_code = test_code,
                answers = answers,
                score_per_question = score_per_question,
                created_by = created_by
            )
            db.add(new_answer_key)

        saved_test_codes.append(test_code)
    db.commit()

    if not saved_test_codes:
        raise ValueError("Không tìm thấy dữ liệu đáp án hợp lệ trong file")

    total_score = sum(score_per_question.values())

    return {
        "test_codes": saved_test_codes,
        "total_questions": len(active_questions),
        "score_per_question": score_per_question,
        "total_score": round(total_score,2),
        "has_custom_scores": has_custom_scores
    }
