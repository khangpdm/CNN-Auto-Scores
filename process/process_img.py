import os

import cv2
import numpy as np

samples_dir = "../Samples/"
sample = "1.jpg"
full_path = os.path.join(samples_dir, sample)


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
    gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray_img, (5, 5), 0)
    img_canny = cv2.Canny(blurred, 100, 200)
    return img_canny


img = cv2.imread(full_path)

img1 = crop_image(img)
if img1 is not None:
    height, width = img1.shape[:2]
    if height > 800 or width > 800:
        scale = 800 / max(height, width)
        new_width = int(width * scale)
        new_height = int(height * scale)
        img1 = cv2.resize(img1, (new_width, new_height))
        print(f"Đã resize thành: {new_width}x{new_height}")

    cv2.imshow("Anh goc", img1)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
