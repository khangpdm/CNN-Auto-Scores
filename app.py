import time
import cv2
import numpy as np
import os
from process_img import (
    find_answer_blocks,
    get_answers,
    process_ans_blocks,
    process_list_ans,
)

# ============================================
# ĐÁP ÁN ĐÚNG
# ============================================
ANSWERS_KEY = {
    1: "A", 2: "B", 3: "B", 4: None, 5: "A", 6: "C", 7: "D", 8: "B", 9: "A", 10: "C",
    11: "C", 12: "A", 13: "D", 14: "B", 15: None, 16: "A", 17: "D", 18: "B", 19: "C", 20: "A",
    21: None, 22: "B", 23: None, 24: None, 25: "C", 26: "A", 27: "C", 28: None, 29: "D", 30: "B",
    31: None, 32: "B", 33: "A", 34: "B", 35: "C", 36: "D", 37: "A", 38: None, 39: "B", 40: "C",
    41: None, 42: "A", 43: "B", 44: "C", 45: "D", 46: "C", 47: "A", 48: None, 49: "B", 50: None,
    51: "B", 52: "D", 53: "A", 54: "B", 55: "C", 56: "B", 57: "A", 58: "C", 59: "A", 60: "B",
    61: "B", 62: "A", 63: "B", 64: "A", 65: "C", 66: "A", 67: None, 68: "B", 69: "C", 70: "A",
    71: "B", 72: "A", 73: "D", 74: "C", 75: "B", 76: "B", 77: "C", 78: "A", 79: "D", 80: "B",
    81: "A", 82: "B", 83: "A", 84: "C", 85: "B", 86: "D", 87: "C", 88: "A", 89: "C", 90: "B",
    91: "B", 92: "C", 93: "D", 94: "A", 95: "D", 96: "C", 97: "A", 98: "B", 99: "D", 100: "A",
    101: "B", 102: "A", 103: "D", 104: "C", 105: "B", 106: "C", 107: "A", 108: "D", 109: "B", 110: "A",
    111: "C", 112: "B", 113: "A", 114: "B", 115: "A", 116: "A", 117: "B", 118: None, 119: "B", 120: "A",
}


# ============================================
# CAMERA PROCESSOR - VỚI DEBUG CHI TIẾT
# ============================================
class CameraProcessor:
    def __init__(self, answer_key=ANSWERS_KEY, model_path="weighted.h5", threshold=0.7):
        self.answer_key = answer_key
        self.model_path = model_path
        self.threshold = threshold
        self.stats = {"total": 0, "answered": 0, "correct": 0}

        self.last_predictions = None

        # FPS tracking
        self.fps = 0
        self.frame_count = 0
        self.fps_start_time = time.time()

        # Xử lý skip frame
        self.frame_skip_counter = 0
        self.FRAME_SKIP = 2

        # Debug
        self.debug_count = 0
        self.save_debug_frames = True  # Lưu frame để debug

    def process_frame(self, frame):
        """Xử lý frame từ camera"""
        if frame is None:
            return None, None

        display = frame.copy()
        h, w = display.shape[:2]

        # Resize cho nhanh
        if w > 800:
            scale = 800 / w
            frame_resized = cv2.resize(frame, (800, int(h * scale)))
        else:
            frame_resized = frame

        # Skip frame
        self.frame_skip_counter += 1
        predictions = None

        if self.frame_skip_counter >= self.FRAME_SKIP:
            self.frame_skip_counter = 0

            # Lưu frame debug
            if self.save_debug_frames and self.debug_count < 10:
                cv2.imwrite(f"debug_frame_{self.debug_count}.jpg", frame_resized)
                print(f"💾 Đã lưu debug frame {self.debug_count}")
                self.debug_count += 1
                if self.debug_count == 10:
                    print("✅ Đã lưu 10 frame debug, kiểm tra thư mục hiện tại")

            predictions = self._process_frame_with_debug(frame_resized)

            if predictions:
                self.last_predictions = predictions
                print(f"✅ Xử lý thành công! {len(predictions)} câu")

        # Vẽ kết quả
        if self.last_predictions:
            display = self.draw_results(display, self.last_predictions)

        # Vẽ thông tin
        self._update_fps()
        self._draw_info(display, w)

        return display, self.last_predictions

    def _process_frame_with_debug(self, frame):
        """Xử lý frame với debug chi tiết"""
        try:
            print("=" * 50)
            print("🔍 Bắt đầu xử lý frame...")

            # Lưu frame
            temp_path = "temp_frame_camera.jpg"
            cv2.imwrite(temp_path, frame)
            print(f"📸 Đã lưu frame tạm: {temp_path}")

            # Bước 1: Tìm answer blocks
            print("📌 Bước 1: Tìm answer blocks...")
            ans_blocks = find_answer_blocks(temp_path)

            if not ans_blocks:
                print("❌ KHÔNG TÌM THẤY ANSWER BLOCKS!")
                print("💡 Kiểm tra:")
                print("  - Tờ giấy có đủ sáng không?")
                print("  - Tờ giấy có nằm trong khung hình không?")
                print("  - 4 góc đánh dấu có rõ không?")
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                return None

            print(f"✅ Tìm thấy {len(ans_blocks)} answer blocks")

            # Bước 2: Xử lý blocks
            print("📌 Bước 2: Xử lý answer blocks...")
            list_ans = process_ans_blocks(ans_blocks)

            if not list_ans:
                print("❌ Không xử lý được answer blocks")
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                return None

            print(f"✅ Đã xử lý {len(list_ans)} câu hỏi")

            # Bước 3: Xử lý list answers
            print("📌 Bước 3: Trích xuất lựa chọn...")
            list_choices = process_list_ans(list_ans)

            if not list_choices:
                print("❌ Không trích xuất được lựa chọn")
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                return None

            print(f"✅ Đã trích xuất {len(list_choices)} lựa chọn")

            # Bước 4: Dự đoán
            print("📌 Bước 4: Dự đoán đáp án...")
            predictions = get_answers(list_choices, self.model_path, self.threshold)

            if not predictions:
                print("❌ Không dự đoán được đáp án")
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                return None

            print(f"✅ Dự đoán thành công {len(predictions)} câu")

            # Xóa file tạm
            if os.path.exists(temp_path):
                os.remove(temp_path)

            return predictions

        except Exception as e:
            print(f"❌ LỖI XỬ LÝ: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _update_fps(self):
        self.frame_count += 1
        if time.time() - self.fps_start_time >= 1:
            self.fps = self.frame_count
            self.frame_count = 0
            self.fps_start_time = time.time()

    def _draw_info(self, display, width):
        # FPS
        cv2.putText(
            display,
            f"FPS: {self.fps}",
            (width - 130, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 255, 0),
            2,
        )

        # Trạng thái
        status = "✅ Active" if self.last_predictions else "⏳ Waiting..."
        color = (0, 255, 0) if self.last_predictions else (0, 255, 255)
        cv2.putText(
            display,
            status,
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            color,
            2,
        )

        # Hướng dẫn
        cv2.putText(
            display,
            "q:thoat | s:luu",
            (10, display.shape[0] - 20),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (200, 200, 200),
            1,
        )

    def draw_results(self, display, predictions):
        if not predictions:
            return display

        h, w = display.shape[:2]

        # Thống kê
        total = len(predictions)
        answered = sum(1 for d in predictions.values() if d.get("answer") is not None)
        correct = sum(
            1
            for q, d in predictions.items()
            if d.get("answer") and self.answer_key.get(q) == d["answer"]
        )

        self.stats["total"] = total
        self.stats["answered"] = answered
        self.stats["correct"] = correct

        # Vẽ từng câu
        for q, data in predictions.items():
            if data.get("answer") is None:
                continue

            row = (q - 1) // 10
            col = (q - 1) % 10

            x = 20 + col * 38
            y = 70 + row * 32

            is_correct = self.answer_key.get(q) == data["answer"]
            color = (0, 255, 0) if is_correct else (0, 0, 255)

            cv2.rectangle(display, (x - 2, y - 10), (x + 30, y + 8), color, 1)
            cv2.putText(
                display,
                f"{q}",
                (x - 1, y + 2),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.3,
                (255, 255, 255),
                1,
            )
            cv2.putText(
                display,
                f"{data['answer']}",
                (x + 18, y + 2),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.35,
                color,
                2,
            )

        # Thống kê
        overlay = display.copy()
        cv2.rectangle(overlay, (5, 5), (200, 95), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.6, display, 0.4, 0, display)

        cv2.putText(
            display,
            f"Tong: {total}",
            (15, 25),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            (255, 255, 255),
            1,
        )
        cv2.putText(
            display,
            f"Tra loi: {answered}",
            (15, 42),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            (0, 255, 0),
            1,
        )
        cv2.putText(
            display,
            f"Dung: {correct}",
            (15, 59),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            (0, 255, 0),
            1,
        )
        cv2.putText(
            display,
            f"Sai: {answered - correct}",
            (15, 76),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            (0, 0, 255),
            1,
        )

        return display


# ============================================
# MAIN
# ============================================
def main():
    print("=" * 60)
    print("📱 CHAM DIEM TRAC NGHIEM CAMERA")
    print("=" * 60)
    print("📌 HƯỚNG DẪN:")
    print("  1. Đặt tờ giấy trước camera")
    print("  2. Đảm bảo đủ ánh sáng")
    print("  3. Nhấn 'q' để thoát")
    print("  4. Nhấn 's' để lưu ảnh và kết quả")
    print("-" * 60)

    processor = CameraProcessor(
        answer_key=ANSWERS_KEY,
        model_path="weighted.h5",
        threshold=0.7
    )

    # ===== KẾT NỐI CAMERA =====
    cap = None

    # Thử DroidCam
    print("🔄 Đang kết nối DroidCam...")
    cap = cv2.VideoCapture("http://192.168.2.11:4747/video")

    if not cap.isOpened():
        print("⚠️ Không kết nối được DroidCam, thử webcam...")
        cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("❌ Không mở được camera!")
        print("📌 Kiểm tra:")
        print("  - DroidCam: IP và port đúng, cùng mạng Wi-Fi")
        print("  - Webcam: kết nối USB")
        return

    # Cấu hình camera
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    cap.set(cv2.CAP_PROP_FPS, 30)

    print("✅ Kết nối camera thành công!")
    print("\n📸 Đang kiểm tra chất lượng ảnh...")
    print("💡 Lưu ý: Chương trình sẽ tự động lưu 10 frame đầu để debug")
    print("   Kiểm tra các file 'debug_frame_X.jpg' để xem camera thấy gì")
    print("\n🔄 Đang xử lý...\n")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("⚠️ Không đọc được frame!")
            time.sleep(0.5)
            continue

        # Xử lý frame
        display, predictions = processor.process_frame(frame)

        if display is not None:
            cv2.imshow("Cham diem trac nghiem", display)

        # Xử lý phím bấm
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('s'):
            timestamp = int(time.time())
            filename = f"result_{timestamp}.jpg"
            if display is not None:
                cv2.imwrite(filename, display)
                print(f"💾 Đã lưu ảnh: {filename}")

                # In kết quả chi tiết
                if predictions:
                    print("\n📊 KẾT QUẢ:")
                    correct = 0
                    for q, data in predictions.items():
                        if data['answer'] and ANSWERS_KEY.get(q) == data['answer']:
                            correct += 1
                    print(f"  Đúng: {correct}/{len(predictions)}")
                    print(f"  Tỉ lệ: {correct / len(predictions) * 100:.1f}%")

    cap.release()
    cv2.destroyAllWindows()
    print("\n👋 Đã thoát!")
    print("\n💡 Nếu không nhận diện được, hãy kiểm tra các file debug_frame_X.jpg")
    print("   để xem chất lượng ảnh từ camera như thế nào.")


if __name__ == "__main__":
    main()