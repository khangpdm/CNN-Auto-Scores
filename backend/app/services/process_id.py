import os
import cv2
import imutils
import numpy as np
from core.model import CNN_Model
from .process_ans import pixel_counting

samples_dir = "../Samples/"
sample = "SBD.jpg"
full_path = os.path.join(samples_dir, sample)


def fix_img(img):
    if img is None:
        return []

    h, w = img.shape[:2]
    img = img[: int(h * 0.35), int(w * 0.65) : w]
    return img


def pre_process(img):
    if img is None:
        print("Lỗi ảnh id")
        return None, None

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    #print_img(gray)

    blur = cv2.GaussianBlur(gray, (1, 1), 0)
    #print_img(blur)

    canny = cv2.Canny(blur, 50, 150)
    kernel = np.ones((3, 3), np.uint8)
    canny = cv2.dilate(canny, kernel, iterations=2)
    #print_img(canny)

    cnts = cv2.findContours(canny, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnts = imutils.grab_contours(cnts)

    cnts = sorted(cnts, key=lambda c: cv2.boundingRect(c)[0] + cv2.boundingRect(c)[1])

    id_block = []

    for cnt in cnts:
        x, y, w, h = cv2.boundingRect(cnt)
        area = cv2.contourArea(cnt)
        if area > 20000 and h > w * 2:
            peri = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)

            if len(approx) >= 4:
                block_img = img[y : y + h, x : x + w]
                id_block.append({"img": block_img, "x": x, "y": y})

    if len(id_block) < 2:
        print("Không tìm đủ khối SBD và Mã đề")
        return None, None

    id_student = [id_block[0]]
    id_exam = [id_block[1]]
    # print_img(id_student[0]["img"])
    # print_img(id_exam[0]["img"])
    return id_student, id_exam


def split_id_columns(id_block_list, num_cols,warp_image_shape):
    """Gộp col_id_student và col_id_exam làm một để truyền tham số num_cols"""
    list_col = []
    id_img = id_block_list[0]["img"]
    id_x = id_block_list[0]["x"]
    id_y = id_block_list[0]["y"]

    MOVE_X = 10
    MOVE_Y = 0

    orig_h, orig_w = warp_image_shape
    offset_fix_x = int(orig_w * 0.65)  # Khoảng đã cắt bỏ bên trái theo trục X
    offset_fix_y = 0

    if len(id_img.shape) == 3:
        gray = cv2.cvtColor(id_img, cv2.COLOR_BGR2GRAY)
    else:
        gray = id_img
    h, w = gray.shape[:2]

    offset_col = w // num_cols

    for i in range(num_cols):
        start = i * offset_col
        end = (i + 1) * offset_col
        col_img = gray[:, start:end]
        col_absolute_x = id_x + start + offset_fix_x + MOVE_X
        list_col.append({"img": col_img, "x": col_absolute_x, "y": id_y})

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
            bubble = cv2.resize(bubble, (28, 28), interpolation=cv2.INTER_AREA)
            bubble = bubble.reshape(28, 28, 1)

            center_x = line_x + int(w / 2)
            center_y = line_y + int((start + end) / 2)
            radius = int((end - start) / 2) - 2
            list_choices.append(
                {
                    "img": bubble,
                    "center_x": center_x,
                    "center_y": center_y,
                    "radius": radius,
                    "choice_char": str(i),
                }
            )

    expected_len = len(list_col) * 10
    if len(list_choices) != expected_len:
        print(f"Expected {expected_len}, got {len(list_choices)}")
        return []

    return list_choices


def map_answer(idx):
    return str(idx)


def get_id_from_choices(list_choices, model_path=None, threshold=0.8):
    """Hàm AI dùng chung cho cả SBD và Mã Đề"""
    if not list_choices:
        print("Không có dữ liệu")
        return {}

    if model_path is None:
        CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(CURRENT_DIR, "..", "weights", "weighted.keras")

    model = None
    letters = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
    results = {}
    total_num = len(list_choices) // 10

    # print("\n" + "=" * 70)
    # print(f"{'CỘT':<6} | {'Ý':<3} | {'% PIXEL ĐEN':<13} | {'TRẠNG THÁI FILTER':<18} | {'KẾT QUẢ CUỐI'}")
    # print("=" * 70)

    for q in range(total_num):
        start = q * 10
        q_choices = list_choices[start : start + 10]
        q_num = q + 1

        confidences = []
        debug_info = []
        geometry_data = {}

        for i, choice_dict in enumerate(q_choices):
            bubble = choice_dict["img"]
            cx = choice_dict["center_x"]
            cy = choice_dict["center_y"]
            r = choice_dict["radius"]
            char = choice_dict["choice_char"]

            geometry_data[char] = {"cx": cx, "cy": cy, "r": r}

            status, ratio = pixel_counting(bubble, 10.0, 25.0)

            if status == "EMPTY":
                conf_val = 0.0
                confidences.append(conf_val)
                debug_info.append(f"  - {letters[i]}: Ratio={ratio:5.2f}% -> [EMPTY] (Gán 0.0)")
            elif status == "FILLED":
                conf_val = 1.0
                confidences.append(conf_val)
                debug_info.append(f"  - {letters[i]}: Ratio={ratio:5.2f}% -> [FILLED] (Gán 1.0)")
            else:
                if model is None:
                    model = CNN_Model(model_path).build_model(rt=True)

                if bubble.max() <= 1.0:
                    bubble_uint8 = (bubble * 255).astype(np.uint8)
                else:
                    bubble_uint8 = bubble.astype(np.uint8)

                _, cnn_input_img = cv2.threshold(
                    bubble_uint8,
                    0,
                    255,
                    cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU,
                )

                X_single = np.array([cnn_input_img]) / 255.0
                X_single = X_single.reshape(1, 28, 28, 1)
                pred = model.predict(X_single, verbose=0)
                conf_val = float(pred[0][1])
                confidences.append(conf_val)
                debug_info.append(
                    f"  - {letters[i]}: Ratio={ratio:5.2f}% -> [UNCERTAIN] -> CNN Đoán: {conf_val:.4f}"
                )

        best_idx = np.argmax(confidences)
        best_conf = confidences[best_idx]
        filled_count = sum(1 for c in confidences if c > threshold)

        if filled_count == 1:
            answer = map_answer(best_idx)
        else:
            answer = "Trống/Trùng"

        # print(f"Cột {q_num:<2} | Đang xét 10 lựa chọn:")
        # for log in debug_info:
        #     print(log)
        # print(f"        => Kết luận cột {q_num}: Chọn [{answer}] (Confidence cao nhất: {best_conf:.2f})")
        # print("-" * 70)

        results[q + 1] = {
            "answer": None if answer == "Trống/Trùng" else answer,
            "ratio": float(best_conf),
            "details": {letters[i]: float(confidences[i]) for i in range(10)},  # ĐÃ SỬA: range(10) thay vì range(9)
            "geometry": geometry_data,
        }

    return results


def process_id(warp_image):
    warp_shape = warp_image.shape[:2]
    img = fix_img(warp_image)
    id_student, id_exam = pre_process(img)

    if id_student is None or id_exam is None:
        return {}

    # Bước 1: Chia khối SBD và Mã đề thành các cột dọc
    list_student = split_id_columns(id_student, num_cols=6, warp_image_shape=warp_shape)
    list_exam = split_id_columns(id_exam, num_cols=3, warp_image_shape=warp_shape)

    # Bước 2: Chia tiếp từng cột dọc thành 10 ô số từ 0 -> 9
    id_student_choices = process_list_col(list_student)
    id_exam_choices = process_list_col(list_exam)

    # Bước 3: Đưa vào AI nhận diện bằng hàm dùng chung mới
    id_student_rs = get_id_from_choices(id_student_choices)
    id_exam_rs = get_id_from_choices(id_exam_choices)

    # ĐÃ SỬA: Gộp kết quả dạng dict chuẩn thay vì dùng dấu "+" trái phép
    results = {"student_id": id_student_rs, "exam_id": id_exam_rs}

    # Bước 4: Ghép chuỗi kết quả để in ra màn hình
    # sbd_digits = []
    # for col_idx in sorted(id_student_rs.keys()):
    #     digit = id_student_rs[col_idx]["answer"]
    #     sbd_digits.append(digit if digit is not None else "?")
    #
    # print(f"\n🔮 CHUỖI SỐ BÁO DANH ĐỌC ĐƯỢC: {''.join(sbd_digits)}")
    #
    # exam_digits = []
    # for col_idx in sorted(id_exam_rs.keys()):
    #     digit = id_exam_rs[col_idx]["answer"]
    #     exam_digits.append(digit if digit is not None else "?")
    #
    # print(f"\n🔮 CHUỖI MÃ ĐỀ ĐỌC ĐƯỢC: {''.join(exam_digits)}")

    return results