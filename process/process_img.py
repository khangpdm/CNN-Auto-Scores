import os

import cv2
import imutils
import numpy as np

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


img = cv2.imread(full_path)
img1 = find_sheet_contour(img)
print_img(img1)
# print(img1)
