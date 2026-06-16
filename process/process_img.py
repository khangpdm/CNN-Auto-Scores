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


img = warp_process(full_path)
print_img(img)
# print(img1)
