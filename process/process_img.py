import math
from collections import defaultdict

import cv2
import imutils
import numpy as np
from model import CNN_Model
from six import binary_type

ANSWERS_KEY = {
    1: "A",
    2: "B",
    3: "B",
    4: None,
    5: "A",
    6: "C",
    7: "D",
    8: "B",
    9: "A",
    10: "None",
    11: "C",
    12: "A",
    13: "D",
    14: "B",
    15: None,
    16: "A",
    17: "D",
    18: "B",
    19: "C",
    20: "A",
    21: None,
    22: "B",
    23: None,
    24: None,
    25: "C",
    26: "A",
    27: "C",
    28: None,
    29: "D",
    30: "B",
    31: None,
    32: "B",
    33: "A",
    34: "B",
    35: "C",
    36: "D",
    37: "A",
    38: None,
    39: "B",
    40: "C",
    41: None,
    42: "A",
    43: "B",
    44: "C",
    45: "D",
    46: "C",
    47: "A",
    48: None,
    49: "B",
    50: None,
    51: "B",
    52: "D",
    53: "A",
    54: "None",
    55: "C",
    56: "B",
    57: "None",
    58: "C",
    59: "None",
    60: "None",
    61: "None",
    62: "A",
    63: "B",
    64: "A",
    65: "C",
    66: "A",
    67: None,
    68: "None",
    69: "C",
    70: "A",
    71: "B",
    72: "A",
    73: "D",
    74: "C",
    75: "B",
    76: "B",
    77: "C",
    78: "A",
    79: "D",
    80: "None",
    81: "None",
    82: "B",
    83: "A",
    84: "C",
    85: "None",
    86: "D",
    87: "C",
    88: "A",
    89: "C",
    90: "None",
    91: "None",
    92: "C",
    93: "None",
    94: "None",
    95: "D",
    96: "C",
    97: "A",
    98: "B",
    99: "D",
    100: "None",
    101: "B",
    102: "A",
    103: "D",
    104: "C",
    105: "B",
    106: "C",
    107: "A",
    108: "D",
    109: "B",
    110: "A",
    111: "C",
    112: "B",
    113: "None",
    114: "None",
    115: "None",
    116: "None",
    117: "B",
    118: None,
    119: "None",
    120: "None",
}


# Hàm hiển thị hình ảnh
def print_img(img1):
    if img1 is not None:
        height, width = img1.shape[:2]
        if height > 800 or width > 800:
            scale = 800 / max(height, width)
            new_width = int(width * scale)
            new_height = int(height * scale)
            img1 = cv2.resize(img1, (new_width, new_height))
            print(f"Đã resize thành: {new_width}x{new_height}")

        cv2.imshow("Anh goc", img1)
        while True:
            key = cv2.waitKey(100)  # Kiểm tra phím bấm mỗi 100ms
            if key != -1:
                break
            # Lấy trạng thái cửa sổ , neu cua so dang hien thi se tra ve 1
            if cv2.getWindowProperty("Anh goc", cv2.WND_PROP_VISIBLE) < 1:
                break

        cv2.destroyAllWindows()


def get_x(s):
    return s[1][0]


def get_y(s):
    return s[1][1]


def get_h(s):
    return s[1][3]


def get_x_ver1(s):
    s = cv2.boundingRect(s)
    return s[0] * s[1]


def order_point(pts):
    rect = np.zeros((4, 2), dtype="float32")
    # Theo hàng (axis = 1) cộng trái sang phải
    s = pts.sum(axis=1)
    # Trừ cột trái sang phải
    diff = np.diff(pts, axis=1)
    # Góc 0,0 của x và y sẽ nằm ở trên (Trong hình học máy)
    rect[0] = pts[np.argmin(s)]  # Góc trên-trái (x+y nhỏ nhất)
    rect[2] = pts[np.argmax(s)]  # Góc dưới-phải (x+y lớn nhất)
    rect[1] = pts[np.argmin(diff)]  # Góc trên-phải (x-y nhỏ nhất)
    rect[3] = pts[np.argmax(diff)]  # Góc dưới-trái (x-y lớn nhất)

    return rect


def find_sheet_contour(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    # print_img(gray)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    # print_img(blurred)
    img_canny = cv2.Canny(blurred, 50, 150)
    # print_img(img_canny)
    kernel = np.ones((5, 5), np.uint8)
    img_canny = cv2.dilate(img_canny, kernel, iterations=2)
    # print_img(img_canny)
    cnts = cv2.findContours(img_canny, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnts = imutils.grab_contours(cnts)
    cnts = sorted(cnts, key=cv2.contourArea, reverse=True)

    for c in cnts:
        # Đo độ dài(chu vi) của đuờng viền, true để đảm bảo đuờng viền khép kín
        peri = cv2.arcLength(c, True)
        # Hàm này giúp loại bỏ các điểm không quan trọng, chỉ giữ lại các điểm ngoặc (góc)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4:
            area = cv2.contourArea(approx)
            img_area = image.shape[0] * image.shape[1]
            if area > 0.15 * img_area:
                # approx sẽ trả về kiểu (4,1,2) lần luợt là số góc, mỗi điểm nằm trong 1 list, 2 là x và y
                # (4,2) sẽ trả về x,y trong list đơn giản hơn (bỏ nhiều dấu [])
                return approx.reshape(4, 2)
    return None


def warp_perspective(image, pts, output_w=1700, output_h=2200):
    rect = order_point(pts.astype("float32"))

    # Ghi 4 tọa độ của hình đích, -1 là do pixel bắt đầu từ 0
    dst = np.array(
        [[0, 0], [output_w - 1, 0], [output_w - 1, output_h - 1], [0, output_h - 1]],
        dtype="float32",
    )

    m = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, m, (output_w, output_h))
    return warped


def find_timing_marks(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    for thresh_val in [50, 70, 90, 110, 130]:
        _, thresh = cv2.threshold(gray, thresh_val, 255, cv2.THRESH_BINARY_INV)
        contours, _ = cv2.findContours(
            thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        marks = []
        for c in contours:
            x, y, w, h = cv2.boundingRect(c)
            area = w * h
            ratio = w / float(h) if h > 0 else 0
            # Lấy hình chữ nhật dẹt
            if 30 < area < 4000 and ratio > 1.5 and ratio < 6:
                marks.append((x, y, w, h))

        if len(marks) < 4:
            continue

    h_img, w_img = img.shape[:2]

    margin_x = w_img * 0.1
    margin_y = h_img * 0.1

    marks_in_bound = []
    for m in marks:
        x, y, w, h = m
        cx = x + w / 2
        cy = y + h / 2
        if margin_x < cx < w_img - margin_x and margin_y < cy < h_img - margin_y:
            marks_in_bound.append(m)
    if len(marks_in_bound) < 4:
        return None
    marks_in_bound = np.array(marks_in_bound)
    centers = np.array([[x + w / 2, y + h / 2] for x, y, w, h in marks_in_bound])

    # x+y
    s = centers.sum(axis=1)
    # x-y(Lấy tấy cả cột 0 - tất cả cột 1)
    diff = centers[:, 0] - centers[:, 1]

    tl = centers[np.argmin(s)]
    br = centers[np.argmax(s)]
    tr = centers[np.argmax(diff)]
    bl = centers[np.argmin(diff)]

    img_copy = img.copy()

    # Vẽ tất cả các mark
    for i, (x, y, w, h) in enumerate(marks):
        cv2.rectangle(img_copy, (x, y), (x + w, y + h), (0, 255, 0), 1)
        cv2.putText(
            img_copy,
            str(i + 1),
            (x, y - 5),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (0, 255, 0),
            1,
        )

    # Vẽ 4 điểm góc (to hơn)
    cv2.circle(img_copy, tuple(tl.astype(int)), 12, (0, 0, 255), -1)
    cv2.circle(img_copy, tuple(tr.astype(int)), 12, (255, 0, 0), -1)
    cv2.circle(img_copy, tuple(bl.astype(int)), 12, (0, 255, 255), -1)
    cv2.circle(img_copy, tuple(br.astype(int)), 12, (255, 0, 255), -1)

    # Ghi chú
    cv2.putText(
        img_copy,
        "TL",
        tuple(tl.astype(int) - [30, 30]),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 0, 255),
        2,
    )
    cv2.putText(
        img_copy,
        "TR",
        tuple(tr.astype(int) + [10, -30]),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (255, 0, 0),
        2,
    )
    cv2.putText(
        img_copy,
        "BL",
        tuple(bl.astype(int) - [30, 30]),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 255),
        2,
    )
    cv2.putText(
        img_copy,
        "BR",
        tuple(br.astype(int) + [10, 10]),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (255, 0, 255),
        2,
    )

    # Hiển thị số thứ tự
    cv2.putText(
        img_copy,
        f"Total marks: {len(marks)}",
        (10, 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 255),
        2,
    )

    print(f"tl: {tl}\ntr: {tr}\nbl: {bl}\nbr: {br}\n")
    # print_img(img_copy)
    return np.array([tl, tr, br, bl], dtype="float32")


def warp_process(image, output_w=1700, output_h=2200):
    if isinstance(image, str):
        img = cv2.imread(image)
        if img is None:
            print("Không đọc được ảnh\n")
            return None
    else:
        img = image

    # Strategy 1: Tìm contour
    pts = find_sheet_contour(img)

    # Strategy 2: Tìm timing marks
    if pts is None:
        pts = find_timing_marks(img)

    # Strategy 3: Adaptive threshold + contour
    if pts is None:
        # Thử adaptive threshold
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        cnts = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cnts = imutils.grab_contours(cnts)
        cnts = sorted(cnts, key=cv2.contourArea, reverse=True)

        for c in cnts[:5]:
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.02 * peri, True)
            if len(approx) == 4:
                area = cv2.contourArea(approx)
                if area > 0.1 * img.shape[0] * img.shape[1]:
                    pts = approx.reshape(4, 2)
                    break

    if pts is None:
        print("❌ Không tìm thấy 4 góc\n")
        return None

    warped = warp_perspective(img, pts, output_w, output_h)
    return warped


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

    print(f"Đã trích xuất {len(list_choices)} đáp án")

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


def get_answers(list_choices, model_path="weighted.h5", threshold=0.7):
    if not list_choices:
        print("Không có dữ liệu")
        return {}

    model = None
    letters = ["A", "B", "C", "D"]
    results = {}
    total_question = len(list_choices) // 4

    print("\n" + "=" * 70)
    print(
        f"{'CÂU':<6} | {'Ô':<3} | {'% PIXEL ĐEN':<13} | {'TRẠNG THÁI FILTER':<18} | {'KẾT QUẢ CUỐI'}"
    )
    print("=" * 70)

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
            "details": {letters[i]: float(confidences[i]) for i in range(4)},
            "geometry": geometry_data
        }

    return results
