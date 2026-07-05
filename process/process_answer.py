import math
import os

import cv2
import numpy as np

# Giữ nguyên các hàm import từ file xử lý ảnh của bạn
from process_img import (
    ANSWERS_KEY,
    find_answer_blocks,  # Hãy chắc chắn hàm này bên process_img đã được sửa để trả về tọa độ x, y
    get_answers,
    print_img,
    process_ans_blocks,
    process_list_ans,
    warp_process,
)


def compare_and_print(predictions, answer_key=ANSWERS_KEY):
    if not predictions:
        print("❌ Không có dữ liệu dự đoán")
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
                    "your_answer": your_answer
                    if your_answer is not None
                    else "Chưa trả lời",
                    "correct_answer": correct_answer
                    if correct_answer is not None
                    else "Không có đáp án",
                }
            )
    print("\n" + "=" * 50)
    print(f"📊 KẾT QUẢ TỔNG HỢP: {correct}/{total} ({correct / total * 100:.1f}%)")
    print("=" * 50)
    if wrong_list:
        print("\n📌 CÁC CÂU SAI:")
        for item in wrong_list:
            print(
                f"  Câu {item['question']:3d}: Bạn chọn {item['your_answer']} - Đáp án đúng: {item['correct_answer']}"
            )
    else:
        print("\n🎉 CHÚC MỪNG! BẠN ĐÃ LÀM ĐÚNG TẤT CẢ!")


def process_and_draw_result(warped_img, results, answers_key):
    draw_img = warped_img.copy()

    MOVE_X = -12
    MOVE_Y = 0

    for q_idx, q_data in results.items():
        student_ans = q_data.get("answer")
        true_ans = answers_key.get(q_idx, None)
        geom = q_data["geometry"]

        if student_ans == true_ans and true_ans is not None:
            pos = geom[true_ans]
            cx = pos["cx"] + MOVE_X
            cy = pos["cy"] + MOVE_Y

            cv2.circle(draw_img, (cx,cy), 15, (0,255,0), 3)

        elif student_ans != true_ans and student_ans is not None:
            if student_ans in geom:
                pos_wrong = geom[student_ans]
                cx_w = pos_wrong["cx"] + MOVE_X
                cy_w = pos_wrong["cy"] + MOVE_Y
                cv2.circle(draw_img, (cx_w, cy_w), 15, (0,0,255), 3)
            if true_ans in geom:
                pos_right = geom[true_ans]
                cx_r = pos_right["cx"] + MOVE_X
                cy_r = pos_right["cy"] + MOVE_Y
                cv2.circle(draw_img, (cx_r, cy_r), 15, (0,255,0), 3)
        elif student_ans is None and true_ans is not None:
            if true_ans in geom:
                pos_right = geom[true_ans]
                cv2.circle(draw_img, (pos_right["cx"], pos_right["cy"]), 15, (0,255,255), 3)
    return draw_img

if __name__ == "__main__":
    samples_dir = "../Samples/"
    sample = "SBD.jpg"
    full_path = os.path.join(samples_dir, sample)
    img = cv2.imread(full_path)
    warped = warp_process(img)
    if warped is not None:
        # 2. Tìm khối đáp án kèm tọa độ
        ans_blocks_data = find_answer_blocks(warped)
        # 3. Trích xuất ảnh phục vụ hàm cắt cũ
        list_ans = process_ans_blocks(ans_blocks_data)
        # 4. Trích xuất danh sách bong bóng phẳng đưa vào Model
        list_choices = process_list_ans(list_ans)
        # 5. Nhận diện kết quả qua Model CNN
        results = get_answers(list_choices, model_path="weighted.h5")

        print("--- Nhận diện hoàn tất. Tiến hành vẽ trực quan hóa và in kết quả ---")
        # In bảng kết quả text ra Terminal
        compare_and_print(results, ANSWERS_KEY)
        # 6. Gọi hàm vẽ kết quả lên ảnh đã warped
        final_result_img = process_and_draw_result(
            warped, results, ANSWERS_KEY
        )
        # 7. Hiển thị ảnh kết quả trực quan
        print_img(final_result_img)
