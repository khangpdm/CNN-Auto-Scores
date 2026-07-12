import base64
import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

# Import các hàm điều phối từ các file bạn đã viết
from main_script import main_pipeline, process_and_draw_result, compare_and_print
from services.process_img import ANSWERS_KEY, warp_process
from services.process_ans import process_answer
from services.process_id import process_id

app = FastAPI(
    title="CNN Auto Grading API",
    description="API tự động chấm điểm bài thi trắc nghiệm, nhận diện SBD và Mã đề bằng CNN",
    version="1.0.0"
)

@app.post("/api/v1/scan-exam", summary="Quét và chấm điểm bài thi trắc nghiệm")
async def scan_exam(file: UploadFile = File(...)):
    # 1. Kiểm tra định dạng file truyền vào
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File tải lên phải là một file ảnh!")

    try:
        # 2. Đọc file ảnh từ request chuyển đổi thành mảng OpenCV
        file_bytes = await file.read()
        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Không thể giải mã dữ liệu ảnh.")

        # 3. Chạy qua Pipeline xử lý ảnh tổng thể của bạn
        # Bước A: Warp phẳng ảnh
        warped_img = warp_process(img)
        if warped_img is None:
            return JSONResponse(
                status_code=422,
                content={"status": "error", "message": "Không thể định vị và làm phẳng bài làm (Warp lỗi)."}
            )

        # Bước B: Quét SBD & Mã đề (Đã được sửa không lệch tọa độ)
        id_results = process_id(warped_img)

        # Bước C: Quét đáp án câu hỏi
        ans_results = process_answer(warped_img)
        if not ans_results:
            return JSONResponse(
                status_code=422,
                content={"status": "error", "message": "Không thể trích xuất ma trận câu hỏi trắc nghiệm."}
            )

        # Bước D: Vẽ kết quả trực quan (Đúng/Sai/SBD/Mã đề) lên ảnh warped
        final_result_img = process_and_draw_result(
            warped_img, ans_results, ANSWERS_KEY, id_results=id_results
        )

        # 4. Mã hóa ảnh kết quả sang chuỗi Base64 để trả về client hiển thị
        _, encoded_img = cv2.imencode(".jpg", final_result_img)
        base64_image = base64.b64encode(encoded_img).decode("utf-8")

        # 5. Định dạng lại cấu trúc JSON trả về sạch sẽ
        # Gom chuỗi SBD đọc được
        sbd_str = "".join([id_results["student_id"][i]["answer"] or "?" for i in sorted(id_results.get("student_id", {}).keys())])
        # Gom chuỗi Mã đề đọc được
        exam_str = "".join([id_results["exam_id"][i]["answer"] or "?" for i in sorted(id_results.get("exam_id", {}).keys())])

        # Tính toán số câu đúng / tổng số câu
        total_q = len(ans_results)
        correct_q = sum(1 for q, d in ans_results.items() if d.get("answer") == ANSWERS_KEY.get(q))

        response_data = {
            "status": "success",
            "metadata": {
                "student_id": sbd_str,
                "exam_id": exam_str,
                "score_summary": {
                    "total_questions": total_q,
                    "correct_answers": correct_q,
                    "score": round((correct_q / total_q) * 10, 2)
                }
            },
            "detailed_answers": {
                str(q): {
                    "student_choice": d.get("answer"),
                    "correct_choice": ANSWERS_KEY.get(q),
                    "confidence": d.get("ratio")
                } for q, d in ans_results.items()
            },
            "result_image_base64": f"data:image/jpeg;base64,{base64_image}"
        }

        return JSONResponse(content=response_data)

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Lỗi hệ thống nội bộ: {str(e)}"}
        )

if __name__ == "__main__":
    import uvicorn
    # Chạy server ở port 8000
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)