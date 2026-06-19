import math
import os
from collections import defaultdict

import cv2
import imutils
import numpy as np
from model import CNN_Model

samples_dir = "../Samples/"
sample = "real3.jpg"
full_path = os.path.join(samples_dir, sample)


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
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    img_canny = cv2.Canny(blurred, 100, 200)

    kernel = np.ones((5, 5), np.uint8)
    img_canny = cv2.dilate(img_canny, kernel, iterations=2)

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
            if area > 0.3 * img_area:
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


def warp_process(image, output_w=1700, output_h=2200):
    img = cv2.imread(image)
    if img is None:
        print("Không đọc đựoc ảnh\n")
        return None

    pts = find_sheet_contour(img)
    if pts is None:
        print("Không tìm thấy 4 góc\n")
        return None

    warped = warp_perspective(img, pts, output_w, output_h)
    return warped


def find_answer_blocks(image):
    img = warp_process(image)
    if img is None:
        return None, []

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    img_canny = cv2.Canny(blurred, 50, 150)

    # ones để tạo điểm trắng cho dilate, nếu sài zeros sẽ là điểm đen (kh đc)
    kernel = np.ones((3, 3), np.uint8)
    img_canny = cv2.dilate(img_canny, kernel, iterations=2)

    cnts = cv2.findContours(img_canny, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnts = imutils.grab_contours(cnts)

    ans_blocks = []
    ans_blocks_rects = []
    ans_blocks_img = []

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
                ans_blocks.append(c)
                ans_blocks_rects.append((x, y, w, h))
                block_img = img[y : y + h, x : x + w]
                ans_blocks_img.append(block_img)
    # Vẽ contours lên ảnh
    img_cnts = img.copy()
    cv2.drawContours(img_cnts, ans_blocks, -1, (0, 255, 0), 3)
    # print(ans_blocks_rects)
    return ans_blocks_img


def process_ans_blocks(ans_blocks_img):
    list_ans = []

    for ans_block in ans_blocks_img:
        ans_block_img = np.array(ans_block)

        # .shape trả về chiều cao, chiều rộng và kênh màu
        offset1 = math.ceil(ans_block_img.shape[0] / 6)
        for i in range(6):
            # Vị trí bắt đầu : kết thúc, và : là lấy toàn bộ các cột
            box_img = np.array(ans_block_img[i * offset1 : (i + 1) * offset1, :])
            height_box = box_img.shape[0]

            box_img = box_img[14 : height_box - 14, :]
            offset2 = math.ceil(box_img.shape[0] / 5)

            for j in range(5):
                list_ans.append(box_img[j * offset2 : (j + 1) * offset2, :])

    return list_ans


def process_list_ans(list_ans):
    list_choices = []
    offset = 56
    start = 70

    for ans_img in list_ans:
        if len(ans_img.shape) == 3:
            gray = cv2.cvtColor(ans_img, cv2.COLOR_BGR2GRAY)
        else:
            gray = ans_img

        h, w = gray.shape

        for i in range(4):
            x1 = start + i * offset
            x2 = start + (i + 1) * offset

            if x2 > w:
                print(f"Cảnh báo: x2={x2} > width={w}, bỏ qua")
                continue

            bubble = gray[:, x1:x2]
            _, bubble = cv2.threshold(
                bubble, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU
            )
            bubble = cv2.resize(bubble, (28, 28), interpolation=cv2.INTER_AREA)
            bubble = bubble.reshape(28, 28, 1)

            list_choices.append(bubble)

    print(f"Đã trích xuất {len(list_choices)} đáp án")

    if len(list_choices) != 480:
        print(f"⚠️ Expected 480, got {len(list_choices)}")
        return []

    return list_choices


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

    model = CNN_Model(model_path).build_model(rt=True)

    # Chuẩn hóa về 0 1
    X = np.array(list_choices) / 255.0

    # Dự đoán (Không hiển thị tiến trình)
    predictions = model.predict(X, verbose=0)

    results = {}
    total_questions = len(list_choices) // 4

    for q in range(total_questions):
        start = q * 4
        # Lấy 4 ô của câu hiện tại
        q_preds = predictions[start : start + 4]

        # Tìm ô có xác suất cao nhất
        confidences = [
            pred[1] for pred in q_preds
        ]  # pred[1] là xác suất class 1 (được tô)
        best_idx = np.argmax(confidences)
        best_conf = confidences[best_idx]

        filled_count = sum(1 for c in confidences if c > threshold)
        if filled_count == 0:
            answer = None
        elif filled_count == 1:
            answer = map_answer(best_idx)
        else:
            answer = None

        letters = ["A", "B", "C", "D"]
        results[q + 1] = {
            "answer": answer,
            # "confidence": float(best_conf),
            # "details": {letters[i]: float(confidences[i]) for i in range(4)},
        }

    return results


ans_blocks_img = find_answer_blocks(full_path)
list_ans = process_ans_blocks(ans_blocks_img)
list_choices = process_list_ans(list_ans)
answers = get_answers(list_choices)
print(answers)
# if list_ans is not None:
#     if len(list_choices) > 0:
#         for i in range(len(list_choices)):
#             print_img(list_choices[i])
