import os

import cv2
import imutils
import numpy as np

samples_dir = "../Samples/"
sample = "1.jpg"
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


def crop_image(img):
    img_cnts = img.copy()
    gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray_img, (5, 5), 0)
    img_canny = cv2.Canny(blurred, 100, 200)

    # cnts sẽ trả về img, contours, hierarchy
    cnts = cv2.findContours(img_canny.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE)
    cnts = imutils.grab_contours(cnts)

    # HIển thị đuờng viền
    # cv2.drawContours(img_cnts, cnts, -1, (0, 255, 0), 2)

    for i, c in enumerate(cnts):
        x_curr, y_curr, w_curr, h_curr = cv2.boundingRect(c)
        if w_curr * h_curr > 145000:
            cv2.rectangle(
                img_cnts,
                (x_curr, y_curr),
                (x_curr + w_curr, y_curr + h_curr),
                (0, 255, 0),
                3,
            )
    return img_cnts


img = cv2.imread(full_path)

img1 = crop_image(img)
print_img(img1)
# print(img1)
