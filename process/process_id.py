import math
import os
from collections import defaultdict

import cv2
import imutils
import numpy as np
from model import CNN_Model
from process_img import warp_process, print_img, pixel_counting

samples_dir = "../Samples/"
sample = "SBD.jpg"
full_path = os.path.join(samples_dir, sample)


def fix_img(img):
    if img is None:
        return []

    h, w = img.shape[:2]
    img = img[: int(h * 0.35), int(w * 0.65) : w]
    # cv2.imshow("Test", img)
    # cv2.waitKey()
    return img

def pre_process(img):
    if img is None:
        print("Lỗi ảnh id")
        return

    gray = cv2.cvtColor(img,cv2.COLOR_BGR2GRAY)
    print_img(gray)

    blur = cv2.GaussianBlur(gray,(1,1),0)
    print_img(blur)

    canny = cv2.Canny(blur,50,150)
    kernel = np.ones((3,3), np.uint8)
    canny = cv2.dilate(canny, kernel, iterations = 2)
    print_img(canny)

    cnts = cv2.findContours(canny, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnts = imutils.grab_contours(cnts)

    cnts = sorted(cnts, key = lambda c : cv2.boundingRect(c)[0] + cv2.boundingRect(c)[1])

    id_student = []
    id_exam = []

    id_block = []

    for cnt in cnts:
        x,y,w,h = cv2.boundingRect(cnt)
        area = cv2.contourArea(cnt)
        if area > 20000 and h > w * 2:
            peri = cv2.arcLength(cnt,True)
            approx = cv2.approxPolyDP(cnt,0.02*peri,True)

            if len(approx) >= 4:
                #draw.append(cnt)
                block_img = img[y:y+h,x:x+w]

                ab_x = x
                ab_y = y
                id_block.append({"img": block_img, "x": ab_x, "y": ab_y})
    id_student.append(id_block[0])
    id_exam.append(id_block[1])
    print_img(id_student[0]["img"])
    print_img(id_exam[0]["img"])
    return id_student, id_exam


def col_id_student(id_student):
    list_col = []
    id_img = id_student[0]["img"]
    id_x = id_student[0]["x"]
    id_y = id_student[0]["y"]

    if len(id_img.shape) == 3:
        gray = cv2.cvtColor(id_img, cv2.COLOR_BGR2GRAY)
    else:
        gray = id_img
    h, w = gray.shape[:2]

    NUM_COLS = 6
    offset_col = w // NUM_COLS

    for i in range(NUM_COLS):
        start = i * offset_col
        end = (i + 1) * offset_col
        col_img = gray[:, start:end]
        col_absolute_x = id_x + start
        list_col.append({
            "img": col_img,
            "x": col_absolute_x,
            "y": id_y
        })

    # # In thử từng cột dọc ra màn hình để kiểm tra
    # for i in range(NUM_COLS):
    #     print_img(list_col[i]["img"])

    return list_col

def process_list_col(list_col):
    list_choices = []

    for item in list_col:
        ans_img = item["img"]
        line_x = item["x"]
        line_y = item["y"]

        if len(ans_img.shape) == 3:
            gray = cv2.cvtColor(ans_img, cv2.COLOR_BGR2GRAY)
        else:
            gray = ans_img
        h, w = gray.shape[:2]

        NUM_ROWS = 10
        offset_row = h // NUM_ROWS

        for i in range(NUM_ROWS):
            start = i * offset_row
            end = (i + 1) * offset_row
            bubble = gray[start:end, :]
            bubble = cv2.resize(bubble, (28,28), interpolation=cv2.INTER_AREA)
            bubble = bubble.reshape(28, 28, 1)
            #print_img(bubble)

            center_x = line_x + int(w / 2)
            center_y = line_y + int((start + end)/ 2)
            radius = int((end - start) / 2) -2
            list_choices.append({
                "img": bubble,
                "center_x": center_x,
                "center_y": center_y,
                "radius": radius,
                "choice_char": ["0", "1", "2", "3","4", "5", "6", "7","8", "9"][i]
            })

    if len(list_choices) != 60:
        print(f"Expected 60, got {len(list_choices)}")
        return []
    # # In thử từng cột dọc ra màn hình để kiểm tra
    # for i in range(NUM_COLS):
    #     print(f"--- Hiển thị cột số {i + 1} ---")
    #     print_img(list_col[i]["img"])

    return list_choices

def map_answer(idx):
    return ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"][idx]

def get_answers(list_choices, model_path="weighted.h5", threshold=0.7):
    if not list_choices:
        print("Không có dữ liệu")
        return {}

    model = None
    letters = ["0", "1", "2", "3","4", "5", "6", "7","8", "9"]
    results = {}
    total_num = len(list_choices) // 10

    print("\n" + "=" * 70)
    print(
        f"{'CÂU':<6} | {'Ô':<3} | {'% PIXEL ĐEN':<13} | {'TRẠNG THÁI FILTER':<18} | {'KẾT QUẢ CUỐI'}"
    )
    print("=" * 70)

    for q in range(total_num):
        start = q * 10
        q_choices = list_choices[start : start + 10]
        q_num = q + 1

        confidences = []
        debug_info = []  # Lưu thông tin phục vụ in log debug
        geometry_data = {} #để gom tạo độ từ list_choices

        for i, choice_dict in enumerate(q_choices):
            bubble = choice_dict["img"]
            cx = choice_dict["center_x"]
            cy = choice_dict["center_y"]
            r = choice_dict["radius"]
            char = choice_dict["choice_char"]

            geometry_data[char] = {"cx": cx, "cy": cy, "r": r}

            status, ratio = pixel_counting(bubble,10.0,25.0)

            if status == "EMPTY":
                conf_val = 0.0
                confidences.append(conf_val)
                debug_info.append(
                    f"  - {letters[i]}: Ratio={ratio:5.2f}% -> [EMPTY] (Gán 0.0)"
                )
            elif status == "FILLED":
                conf_val = 1.0
                confidences.append(conf_val)
                debug_info.append(
                    f"  - {letters[i]}: Ratio={ratio:5.2f}% -> [FILLED] (Gán 1.0)"
                )
            else:
                # Vùng nghi ngờ -> Gọi CNN
                if model is None:
                    model = CNN_Model(model_path).build_model(rt=True)

                # Ép kiểu uint8 cho ảnh gốc
                if bubble.max() <= 1.0:
                    bubble_uint8 = (bubble * 255).astype(np.uint8)
                else:
                    bubble_uint8 = bubble.astype(np.uint8)

                # NHỊ PHÂN HÓA (Otsu + INV) ĐỂ PHỤC VỤ CNN
                _, cnn_input_img = cv2.threshold(
                    bubble_uint8,
                    0,
                    255,
                    cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU,
                )

                # Chuẩn hóa đầu vào [0, 1] theo kiến trúc mạng mẫu
                X_single = np.array([cnn_input_img]) / 255.0
                X_single = X_single.reshape(1, 28, 28, 1)
                pred = model.predict(X_single, verbose=0)
                conf_val = float(pred[0][1])
                confidences.append(conf_val)
                debug_info.append(
                    f"  - {letters[i]}: Ratio={ratio:5.2f}% -> [UNCERTAIN] -> CNN đoán: {conf_val:.4f}"
                )

        # Logic quyết định đáp án của câu hỏi
        best_idx = np.argmax(confidences)
        best_conf = confidences[best_idx]
        filled_count = sum(1 for c in confidences if c > threshold)

        if filled_count == 1:
            answer = map_answer(best_idx)
        else:
            answer = "Trống/Trùng"

        # --- IN DEBUG CHI TIẾT TỪNG Ô CỦA CÂU RA TERMINAL ---
        print(f"Câu {q_num:<2} | Đang xét 4 lựa chọn:")
        for log in debug_info:
            print(log)
        print(
            f"       => Kết luận câu {q_num}: Chọn [{answer}] (Confidence cao nhất: {best_conf:.2f})"
        )
        print("-" * 70)

        results[q + 1] = {
            "answer": None if answer == "Trống/Trùng" else answer,
            "ratio": float(best_conf),
            "details": {letters[i]: float(confidences[i]) for i in range(9)},
            "geometry": geometry_data
        }

    return results


# -----------------------------------------------------------------
# LUỒNG CHẠY CHÍNH (MAIN PROCESS)
# -----------------------------------------------------------------
image = cv2.imread(full_path)
img = warp_process(image)
img = fix_img(img)

id_student, id_exam = pre_process(img)

if id_student is not None:
    # Bước 1: Chia khối SBD thành 6 cột dọc
    list_col = col_id_student(id_student)

    # Bước 2: Chia tiếp từng cột dọc thành 10 ô số từ 0 -> 9
    list_choices = process_list_col(list_col)

    # Bước 3: Đưa vào AI nhận diện
    results = get_answers(list_choices)

    # Bước 4: Ghép 6 chữ số tìm được thành chuỗi SBD hoàn chỉnh
    sbd_digits = []
    for col_idx in sorted(results.keys()):
        digit = results[col_idx]["answer"]
        sbd_digits.append(digit if digit is not None else "?")

    print(f"\n🎉 CHUỖI SỐ BÁO DANH ĐỌC ĐƯỢC: {''.join(sbd_digits)}")