import math
import os
import cv2
import numpy as np
# Gi? nguy�n c�c h�m import t? file x? l� ?nh c?a b?n
from process_img import (
    ANSWERS_KEY,
    find_answer_blocks,  # H�y ch?c ch?n h�m n�y b�n process_img ?� ???c s?a ?? tr? v? t?a ?? x, y
    get_answers,
    print_img,
    process_ans_blocks,
    process_list_ans,
    warp_process,
)
def compare_and_print(predictions, answer_key=ANSWERS_KEY):
    if not predictions:
        print("? Kh�ng c� d? li?u d? ?o�n")
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
                    else "Ch?a tr? l?i",
                    "correct_answer": correct_answer
                    if correct_answer is not None
                    else "Kh�ng c� ?�p �n",
                }
            )
    print("\n" + "=" * 50)
    print(f"? K?T QU? T?NG H?P: {correct}/{total} ({correct / total * 100:.1f}%)")
    print("=" * 50)
    if wrong_list:
        print("\n? C�C C�U SAI:")
        for item in wrong_list:
            print(
                f"  C�u {item['question']:3d}: B?n ch?n {item['your_answer']} - ?�p �n ?�ng: {item['correct_answer']}"
            )
    else:
        print("\n? CH�C M?NG! B?N ?� L�M ?�NG T?T C?!")

def process_and_draw_results(warped_img, ans_blocks_data, results, answers_key):
    draw_img = warped_img.copy()
    q_global_idx = 1
    char_to_idx = {"A": 0, "B": 1, "C": 2, "D": 3}
    # =================================================================
    # ?? KHU V?C CH?NH T?A ?? ??NG LO?T (T�nh b?ng ??n v? Pixel)
    # ?? Nh�ch XU?NG D??I: C?ng th�m pixel v�o tr?c Y (+)
    # ?? Nh�ch SANG TR�I: Tr? b?t pixel ? tr?c X (-)
    # =================================================================
    DICH_XONG_DUOI = 0  # T?ng s? n�y n?u mu?n h�nh tr�n h? xu?ng th?p h?n n?a
    DICH_SANG_TRAI = -15  # ?? s? �m ?? k�o h�nh tr�n l�i v? ph�a b�n tr�i
    # =================================================================
    for block in ans_blocks_data:
        if isinstance(block, dict):
            block_img = block["img"]
            b_x = block["x"]
            b_y = block["y"]
        else:
            print(
                "? L?I: H�m find_answer_blocks ch?a ???c c?p nh?t ?? tr? v? t?a ?? (X, Y)!"
            )
            return warped_img
        offset1 = math.ceil(block_img.shape[0] / 6)
        for i in range(6):
            box_img = block_img[i * offset1 : (i + 1) * offset1, :]
            h_box = box_img.shape[0]
            y_sub_start = 14
            box_img_sub = box_img[y_sub_start : h_box - 14, :]
            offset2 = math.ceil(box_img_sub.shape[0] / 5)
            for j in range(5):
                if q_global_idx > 120:
                    break
                q_abs_y = b_y + (i * offset1) + y_sub_start + (j * offset2)
                row_height = offset2
                # ? S?A TR?C Y: C?ng th�m kho?ng d?ch xu?ng d??i
                center_y = q_abs_y + int(row_height / 2) + DICH_XONG_DUOI
                w = box_img_sub.shape[1]
                if w < 200:
                    q_global_idx += 1
                    continue
                if w < 340:
                    start = int(w * 0.25)
                    offset = int((w - start) / 4.0)
                else:
                    offset = 68
                    start = 70
                q_res = results.get(q_global_idx, None)
                true_ans = answers_key.get(q_global_idx, "None")
                if true_ans == "None":
                    true_ans = None
                if q_res:
                    student_ans = q_res["answer"]
                    # TH1: H?c sinh ch?n ?�NG
                    if student_ans == true_ans and true_ans is not None:
                        idx = char_to_idx[true_ans]
                        x1 = start + idx * offset
                        x2 = start + (idx + 1) * offset
                        # ? S?A TR?C X: C?ng th�m kho?ng d?ch sang tr�i (c?ng s? �m = tr?)
                        center_x = b_x + int((x1 + x2) / 2) + DICH_SANG_TRAI
                        radius = int((x2 - x1) / 2) - 2
                        cv2.circle(
                            draw_img, (center_x, center_y), radius, (0, 255, 0), 3
                        )
                    # TH2: H?c sinh ch?n SAI
                    elif student_ans != true_ans:
                        # 2.1 V? � h?c sinh ch?n Sai
                        if student_ans is not None:
                            idx_wrong = char_to_idx[student_ans]
                            x1 = start + idx_wrong * offset
                            x2 = start + (idx_wrong + 1) * offset
                            # ? S?A TR?C X
                            center_x_wrong = b_x + int((x1 + x2) / 2) + DICH_SANG_TRAI
                            radius_wrong = int((x2 - x1) / 2) - 2
                            cv2.circle(
                                draw_img,
                                (center_x_wrong, center_y),
                                radius_wrong,
                                (0, 0, 255),
                                3,
                            )
                        # 2.2 V? v? tr� ?�ng th?c t? ?? ??i chi?u
                        if true_ans is not None:
                            idx_right = char_to_idx[true_ans]
                            x1 = start + idx_right * offset
                            x2 = start + (idx_right + 1) * offset
                            # ? S?A TR?C X
                            center_x_right = b_x + int((x1 + x2) / 2) + DICH_SANG_TRAI
                            radius_right = int((x2 - x1) / 2) - 2
                            cv2.circle(
                                draw_img,
                                (center_x_right, center_y),
                                radius_right,
                                (0, 255, 0),
                                2,
                            )
                q_global_idx += 1
    return draw_img

if __name__ == "__main__":
    samples_dir = "../Samples/"
    sample = "SBD.jpg"
    full_path = os.path.join(samples_dir, sample)
    img = cv2.imread(full_path)
    warped = warp_process(img)
    if warped is not None:
        # 2. T�m kh?i ?�p �n k�m t?a ??
        ans_blocks_data = find_answer_blocks(warped)
        # 3. Tr�ch xu?t ?nh ph?c v? h�m c?t c?
        just_images = [block["img"] for block in ans_blocks_data]
        list_ans = process_ans_blocks(just_images)
        # 4. Tr�ch xu?t danh s�ch bong b�ng ph?ng ??a v�o Model
        list_choices = process_list_ans(list_ans)
        # 5. Nh?n di?n k?t qu? qua Model CNN
        results = get_answers(list_choices, model_path="weighted.h5")
        if results:
            print(
                "--- Nh?n di?n ho�n t?t. Ti?n h�nh v? tr?c quan h�a v� in k?t qu? ---"
            )
            # In b?ng k?t qu? text ra Terminal
            compare_and_print(results, ANSWERS_KEY)
            # 6. G?i h�m v? k?t qu? l�n ?nh ?� warped
            final_result_img = process_and_draw_results(
                warped, ans_blocks_data, results, ANSWERS_KEY
            )
            # 7. Hi?n th? ?nh k?t qu? tr?c quan
            print_img(final_result_img)