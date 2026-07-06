import math
import os
import cv2
import numpy as np

# Giữ nguyên các hàm import từ file xử lý ảnh của bạn
from services.process_img import (
    ANSWERS_KEY,
    print_img,
    warp_process,
)
from services.process_ans import (
    process_answer
)
from services.process_id import process_id


def compare_and_print(predictions, answer_key=ANSWERS_KEY):
    if not predictions:
        print("❌ Không có dữ liệu để đoán")
        return
    total = len(predictions)
    correct = 0
    wrong_list = []
    for q, data in predictions.items():
        your_answer = data.get("answer")
        correct_answer = answer_key.get(q)
        your_answer = None if your_answer == "None" else your_answer
        correct_answer = None if correct_answer == "None" else correct_answer
        if your_answer == correct_answer:
            correct += 1
        else:
            wrong_list.append(
                {
                    "question": q,
                    "your_answer": your_answer if your_answer is not None else "Chưa trả lời",
                    "correct_answer": correct_answer if correct_answer is not None else "Không có đáp án",
                }
            )
    print("\n" + "=" * 50)
    print(f"📊 KẾT QUẢ TỔNG HỢP: {correct}/{total} ({correct / total * 100:.1f}%)")
    print("=" * 50)
    if wrong_list:
        print("\n❌ CÁC CÂU SAI:")
        for item in wrong_list:
            print(
                f"  Câu {item['question']:3d}: Bạn chọn {item['your_answer']} - Đáp án đúng: {item['correct_answer']}"
            )
    else:
        print("\n🎉 CHÚC MỪNG! BẠN ĐÃ LÀM ĐÚNG TẤT CẢ!")


def process_and_draw_result(warped_img, results, answers_key, id_results=None):
    draw_img = warped_img.copy()

    MOVE_X = -12
    MOVE_Y = 0

    for q_idx, q_data in results.items():
        student_ans = q_data.get("answer")
        true_ans = answers_key.get(q_idx, None)
        geom = q_data.get("geometry", {})

        if student_ans == true_ans and true_ans is not None:
            if true_ans in geom:
                pos = geom[true_ans]
                cx = pos["cx"] + MOVE_X
                cy = pos["cy"] + MOVE_Y
                cv2.circle(draw_img, (cx, cy), 15, (0, 255, 0), 3)

        elif student_ans != true_ans and student_ans is not None:
            if student_ans in geom:
                pos_wrong = geom[student_ans]
                cx_w = pos_wrong["cx"] + MOVE_X
                cy_w = pos_wrong["cy"] + MOVE_Y
                cv2.circle(draw_img, (cx_w, cy_w), 15, (0, 0, 255), 3)
            if true_ans in geom:
                pos_right = geom[true_ans]
                cx_r = pos_right["cx"] + MOVE_X
                cy_r = pos_right["cy"] + MOVE_Y
                cv2.circle(draw_img, (cx_r, cy_r), 15, (0, 255, 0), 3)

        elif student_ans is None and true_ans is not None:
            if true_ans in geom:
                pos_right = geom[true_ans]
                cx_r = pos_right["cx"] + MOVE_X
                cy_r = pos_right["cy"] + MOVE_Y
                cv2.circle(draw_img, (cx_r, cy_r), 15, (0, 255, 255), 3)
    if id_results:
        # Gom hai nhóm SBD và Mã đề xử lý chung một lượt bằng vòng lặp
        for key_name in ["student_id", "exam_id"]:
            if key_name in id_results:
                block_data = id_results[key_name]

                # Duyệt qua từng cột trong khối SBD/Mã đề
                for col_idx, col_data in block_data.items():
                    chosen_ans = col_data.get("answer")
                    geom = col_data.get("geometry", {})

                    # Nếu học sinh có tô ô đó và có tọa độ geometry
                    if chosen_ans and chosen_ans in geom:
                        pos = geom[chosen_ans]
                        cx = pos["cx"] + MOVE_X
                        cy = pos["cy"] + MOVE_Y
                        # Vẽ vòng tròn màu xanh lá cây để biểu thị ô đã được nhận diện thành công
                        cv2.circle(draw_img, (cx, cy), 15, (0, 255, 0), 3)

    return draw_img


def main_pipeline(image_path, answer_key=ANSWERS_KEY):
    # 1. Đọc ảnh đầu vào
    img = cv2.imread(image_path)
    if img is None:
        print(f"❌ Không thể đọc được file ảnh tại: {image_path}")
        return

    print("📸 1. Đang căn chỉnh và làm phẳng ảnh (Warp Process)...")
    warped_img = warp_process(img)
    if warped_img is None:
        print("❌ Lỗi: Không thể xử lý làm phẳng ảnh!")
        return

    # 2. Nhận diện Số báo danh & Mã đề
    print("🆔 2. Đang quét Số báo danh và Mã đề...")
    id_results = process_id(warped_img)

    # 3. Nhận diện đáp án trắc nghiệm câu hỏi
    print("📝 3. Đang quét ma trận đáp án bài làm...")
    # LƯU Ý: Hàm process_answer của bạn PHẢI return ra dictionary `results` chứa dữ liệu hình học
    ans_results = process_answer(warped_img)

    if not ans_results:
        print("❌ Lỗi: Không lấy được kết quả nhận diện đáp án!")
        return

    # 4. So sánh kết quả với đáp án mẫu và in ra Terminal
    #compare_and_print(ans_results, answer_key)

    # 5. Vẽ vòng tròn kết quả (Đúng/Sai/Bỏ trống) trực tiếp lên ảnh warped
    print("🎨 4. Đang vẽ kết quả trực quan lên bài làm...")
    final_result_img = process_and_draw_result(warped_img, ans_results, answer_key,id_results)

    # 6. Hiển thị ảnh kết quả cuối cùng
    print("✅ Hoàn thành! Đang hiển thị kết quả...")
    print_img(final_result_img)

    # Bạn có thể lưu lại ảnh nếu muốn kiểm tra trực tiếp trong thư mục:
    # cv2.imwrite("result_output.jpg", final_result_img)


if __name__ == "__main__":
    samples_dir = "/home/khangpham/Documents/Python/CNN-Auto-Scores/Samples/"
    sample = "SBD.jpg"
    full_path = os.path.join(samples_dir, sample)

    # Chỉ cần gọi đúng 1 hàm này để chạy toàn bộ chương trình
    main_pipeline(full_path, ANSWERS_KEY)