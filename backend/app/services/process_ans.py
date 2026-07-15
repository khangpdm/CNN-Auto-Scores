import math
import os

import cv2
import imutils
import numpy as np
from core.model import CNN_Model

def find_answer_blocks(img):
    if img is None:
        return []
    # Cắt phần dưới
    h, w = img.shape[:2]
    cut = int(h * 0.3)
    img = img[cut:h, :]

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # print_img(gray)

    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    # print_img(blurred)

    img_canny = cv2.Canny(blurred, 50, 150)
    # print_img(img_canny)

    # ones để tạo điểm trắng cho dilate, nếu sài zeros sẽ là điểm đen (kh đc)
    kernel = np.ones((3, 3), np.uint8)
    img_canny = cv2.dilate(img_canny, kernel, iterations=2)
    # print_img(img_canny)

    cnts = cv2.findContours(img_canny, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnts = imutils.grab_contours(cnts)

    ans_blocks_data = []

    # Sắp xếp contours theo tọa độ x,y tăng dần
    cnts = sorted(cnts, key=lambda c: cv2.boundingRect(c)[0] + cv2.boundingRect(c)[1])

    for c in cnts:
        x, y, w, h = cv2.boundingRect(c)
        area = cv2.contourArea(c)

        if area > 100000 and h > w * 1.5:
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.02 * peri, True)

            # Gần giống hình chữ nhật
            if len(approx) >= 4:
                block_img = img[y : y + h, x : x + w]

                ab_y = y + cut
                ab_x = x
                ans_blocks_data.append({"img": block_img, "x": ab_x, "y": ab_y})

    return ans_blocks_data


def process_ans_blocks(ans_blocks_data):
    list_ans = []

    for block in ans_blocks_data:
        # print_img(ans_block)
        ans_block_img = np.array(block["img"])
        b_x = block["x"]
        b_y = block["y"]

        # .shape trả về chiều cao, chiều rộng và kênh màu
        offset1 = math.ceil(ans_block_img.shape[0] / 6)
        for i in range(6):
            # Vị trí bắt đầu : kết thúc, và : là lấy toàn bộ các cột
            y_start = i * offset1
            box_img = np.array(ans_block_img[i * offset1 : (i + 1) * offset1, :])
            height_box = box_img.shape[0]

            box_img = box_img[14 : height_box - 14, :]
            offset2 = math.ceil(box_img.shape[0] / 5)

            for j in range(5):
                line_y_in_block = y_start + 14 + (j * offset2)
                line_img = box_img[j * offset2 : (j + 1) * offset2]
                list_ans.append({
                    "img": line_img,
                    "x": b_x,
                    "y": b_y + line_y_in_block
                })

    return list_ans


def process_list_ans(list_ans):
    list_choices = []

    for item in list_ans:
        ans_img = item["img"]
        line_x = item["x"]
        line_y = item["y"]

        if len(ans_img.shape) == 3:
            gray = cv2.cvtColor(ans_img, cv2.COLOR_BGR2GRAY)
        else:
            gray = ans_img

        h, w = gray.shape
        # Tính offset dựa trên chiều rộng thực tế
        if w < 200:  # Nếu block quá nhỏ, bỏ qua
            continue

        # Điều chỉnh offset cho phù hợp với width
        if w < 340:  # Cho block nhỏ hơn
            start = int(w * 0.25)  # Margin 5%
            offset = int((w - start) / 4.0)
        else:
            offset = 68
            start = 70

        for i in range(4):
            x1 = start + i * offset
            x2 = start + (i + 1) * offset

            if x2 > w:
                print(f"Cảnh báo: x2={x2} > width={w}, bỏ qua")
                continue

            bubble = gray[:, x1:x2]
            bubble = cv2.resize(bubble, (28, 28), interpolation=cv2.INTER_AREA)
            bubble = bubble.reshape(28, 28, 1)
            # print_img(bubble)

            center_x = line_x + int((x1 + x2) / 2)
            center_y = line_y + int(h/2)
            radius = int((x2 - x1) / 2) - 2
            list_choices.append({
                "img": bubble,
                "center_x": center_x,
                "center_y": center_y,
                "radius": radius,
                "choice_char": ["A","B","C","D"][i]
            })

    #print(f"Đã trích xuất {len(list_choices)} đáp án")

    if len(list_choices) != 480:
        print(f"⚠️ Expected 480, got {len(list_choices)}")
        return []

    return list_choices


def pixel_counting(bubble_img, lower_th=5.0, upper_th=15.0):
    # 1. Ép kiểu về uint8
    if bubble_img.max() <= 1.0:
        gray = (bubble_img * 255).astype(np.uint8)
    else:
        gray = bubble_img.astype(np.uint8)

    gray = np.squeeze(gray)

    _, binary = cv2.threshold(gray, 115, 255, cv2.THRESH_BINARY_INV)

    # Đếm số pixel trắng (vết tô + chữ cái)
    total_pixels = binary.size
    white_pixels = cv2.countNonZero(binary)
    white_ratio = (white_pixels / total_pixels) * 100

    if white_ratio < lower_th:
        return "EMPTY", white_ratio
    elif white_ratio > upper_th:
        return "FILLED", white_ratio
    else:
        return "UNCERTAIN", white_ratio


def map_answer(idx):
    if idx % 4 == 0:
        ans_cir = "A"
    elif idx % 4 == 1:
        ans_cir = "B"
    elif idx % 4 == 2:
        ans_cir = "C"
    else:
        ans_cir = "D"

    return ans_cir


def get_answers(list_choices, model_path=None, threshold=0.8):
    if not list_choices:
        print("Không có dữ liệu")
        return {}

    if model_path is None:
        CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(CURRENT_DIR, "..", "weights", "weighted.keras")
    model = None

    letters = ["A", "B", "C", "D"]
    results = {}
    total_question = len(list_choices) // 4

    for q in range(total_question):
        start = q * 4
        q_choices = list_choices[start : start + 4]
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

            status, ratio = pixel_counting(bubble)

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

        # # --- IN DEBUG CHI TIẾT TỪNG Ô CỦA CÂU RA TERMINAL ---
        # print(f"Câu {q_num:<2} | Đang xét 4 lựa chọn:")
        # for log in debug_info:
        #     print(log)
        # print(
        #     f"       => Kết luận câu {q_num}: Chọn [{answer}] (Confidence cao nhất: {best_conf:.2f})"
        # )
        # print("-" * 70)

        results[q + 1] = {
            "answer": None if answer == "Trống/Trùng" else answer,
            "ratio": float(best_conf),
            "details": {letters[i]: float(confidences[i]) for i in range(4)},
            "geometry": geometry_data
        }

    return results


def process_answer(warp_image):
    if warp_image is None:
        print("❌ Ảnh đầu vào không hợp lệ!")
        return {}

    # Bước 1: Tìm và cắt ra các khối chứa đáp án (Answer Blocks)
    #print("🔄 Bước 1: Đang tìm kiếm các khối đáp án...")
    ans_blocks_data = find_answer_blocks(warp_image)
    if not ans_blocks_data:
        #print("❌ Không tìm thấy khối đáp án nào đạt tiêu chuẩn!")
        return {}

    # Bước 2: Cắt các khối đáp án thành từng dòng câu hỏi riêng biệt
    #print(f"🔄 Bước 2: Đã tìm thấy {len(ans_blocks_data)} khối. Đang phân tách câu hỏi...")
    list_ans = process_ans_blocks(ans_blocks_data)

    # Bước 3: Cắt từng dòng thành 4 ô tròn (A, B, C, D) riêng lẻ
    #print("🔄 Bước 3: Đang trích xuất chi tiết từng ô tròn bubble (A, B, C, D)...")
    list_choices = process_list_ans(list_ans)
    if not list_choices:
        print("❌ Lỗi cấu trúc: Số lượng ô tròn trích xuất không khớp tiêu chuẩn (480 ô)!")
        return {}

    # Bước 4: Đưa các ô tròn vào bộ lọc Pixel + AI CNN để nhận diện đáp án từng câu
    #print("🔄 Bước 4: Đang chạy AI chấm điểm và nhận diện đáp án...")
    final_results = get_answers(list_choices,threshold=0.8)
    return final_results
