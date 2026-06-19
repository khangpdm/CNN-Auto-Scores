import time

import cv2
import imutils
import numpy as np

ANSWERS_KEY = {
    1: {"answer": "A"},
    2: {"answer": "B"},
    3: {"answer": "B"},
    4: {"answer": None},
    5: {"answer": "A"},
    6: {"answer": "C"},
    7: {"answer": "D"},
    8: {"answer": "B"},
    9: {"answer": "A"},
    10: {"answer": "C"},
    11: {"answer": "C"},
    12: {"answer": "A"},
    13: {"answer": "D"},
    14: {"answer": "B"},
    15: {"answer": None},
    16: {"answer": "A"},
    17: {"answer": "D"},
    18: {"answer": "B"},
    19: {"answer": "C"},
    20: {"answer": "A"},
    21: {"answer": None},
    22: {"answer": "B"},
    23: {"answer": None},
    24: {"answer": None},
    25: {"answer": "C"},
    26: {"answer": "A"},
    27: {"answer": "C"},
    28: {"answer": None},
    29: {"answer": "D"},
    30: {"answer": "B"},
    31: {"answer": None},
    32: {"answer": "B"},
    33: {"answer": "A"},
    34: {"answer": "B"},
    35: {"answer": "C"},
    36: {"answer": "D"},
    37: {"answer": "A"},
    38: {"answer": None},
    39: {"answer": "B"},
    40: {"answer": "C"},
    41: {"answer": None},
    42: {"answer": "A"},
    43: {"answer": "B"},
    44: {"answer": "C"},
    45: {"answer": "D"},
    46: {"answer": "C"},
    47: {"answer": "A"},
    48: {"answer": None},
    49: {"answer": "B"},
    50: {"answer": None},
    51: {"answer": "B"},
    52: {"answer": "D"},
    53: {"answer": "A"},
    54: {"answer": "B"},
    55: {"answer": "C"},
    56: {"answer": "B"},
    57: {"answer": "A"},
    58: {"answer": "C"},
    59: {"answer": "A"},
    60: {"answer": "B"},
    61: {"answer": "B"},
    62: {"answer": "A"},
    63: {"answer": "B"},
    64: {"answer": "A"},
    65: {"answer": "C"},
    66: {"answer": "A"},
    67: {"answer": None},
    68: {"answer": "B"},
    69: {"answer": "C"},
    70: {"answer": "A"},
    71: {"answer": "B"},
    72: {"answer": "A"},
    73: {"answer": "D"},
    74: {"answer": "C"},
    75: {"answer": "B"},
    76: {"answer": "B"},
    77: {"answer": "C"},
    78: {"answer": "A"},
    79: {"answer": "D"},
    80: {"answer": "B"},
    81: {"answer": "A"},
    82: {"answer": "B"},
    83: {"answer": "A"},
    84: {"answer": "C"},
    85: {"answer": "B"},
    86: {"answer": "D"},
    87: {"answer": "C"},
    88: {"answer": "A"},
    89: {"answer": "C"},
    90: {"answer": "B"},
    91: {"answer": "B"},
    92: {"answer": "C"},
    93: {"answer": "D"},
    94: {"answer": "A"},
    95: {"answer": "D"},
    96: {"answer": "C"},
    97: {"answer": "A"},
    98: {"answer": "B"},
    99: {"answer": "D"},
    100: {"answer": "A"},
    101: {"answer": "B"},
    102: {"answer": "A"},
    103: {"answer": "D"},
    104: {"answer": "C"},
    105: {"answer": "B"},
    106: {"answer": "C"},
    107: {"answer": "A"},
    108: {"answer": "D"},
    109: {"answer": "B"},
    110: {"answer": "A"},
    111: {"answer": "C"},
    112: {"answer": "B"},
    113: {"answer": "A"},
    114: {"answer": "B"},
    115: {"answer": "A"},
    116: {"answer": "A"},
    117: {"answer": "B"},
    118: {"answer": None},
    119: {"answer": "B"},
    120: {"answer": "A"},
}

print("=" * 50)
print("📱 TEST DROIDCAM")
print("=" * 50)

# ============================================
# CẤU HÌNH DROIDCAM
# ============================================
# Thay địa chỉ IP và port theo DroidCam của bạn
IP = "192.168.2.10"
PORT = 4747

print(f"📱 Địa chỉ: http://{IP}:{PORT}/video")
print("📌 HƯỚNG DẪN:")
print("  1. Mở app DroidCam trên điện thoại")
print("  2. Bật Wi-Fi (cùng mạng với máy tính)")
print("  3. Bấm 'Start Server' trên app")
print("  4. Kiểm tra IP hiển thị trên app")
print("-" * 50)

url = f"http://{IP}:{PORT}/video"
cap = cv2.VideoCapture(url)

if not cap.isOpened():
    print("Không thể kết nối Droidcam\n")
    exit()

ret, frame = cap.read()
if not ret or frame is None:
    print("Đọc frame thất bại!")
    cap.release()
    exit()
print("Kết nối thành công!")
print("ĐANG HIỂN THỊ DROICAM")
print("-" * 50)
print("Nhấn 'q' để thoát")
print("Nhấn 's' để chụp ảnh")
print("-" * 50)

while True:
    ret, frame = cap.read()
    if not ret or frame is None:
        print("Mất kết nối DroidCam !")
        break

    if ret:
        cv2.imshow("Test", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break
cap.release()
cv2.destroyAllWindows()
