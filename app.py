import streamlit as st
import cv2
import numpy as np
import os
import time

from process.process_ans import find_answer_blocks, process_ans_blocks, process_list_ans, get_answers
from process.process_answer import process_and_draw_result, compare_and_print
from process.process_img import warp_process, ANSWERS_KEY

st.title("Ứng dụng Chấm Điểm Tự Động")

# 1. Bật tính năng upload nhiều file bằng tham số accept_multiple_files=True
uploaded_files = st.file_uploader(
    "Upload danh sách các ảnh bài thi cần chấm",
    type=["jpg", "jpeg", "png"],
    accept_multiple_files=True  # <--- Kích hoạt chọn nhiều file
)

# Kiểm tra nếu người dùng đã chọn ít nhất 1 file
if uploaded_files and len(uploaded_files) > 0:

    num_files = len(uploaded_files)
    st.info(f"Đã nhận {num_files} ảnh bài thi. Bắt đầu tiến trình chấm điểm hàng loạt...")

    # Khởi tạo thanh tiến trình tổng thể
    global_progress = st.progress(0)
    global_status = st.empty()

    # Chuẩn bị đường dẫn model tuyệt đối trước vòng lặp để tối ưu hiệu năng
    base_dir = os.path.dirname(os.path.abspath(__file__))
    absolute_model_path = os.path.join(base_dir, "process", "weighted.h5")

    # Duyệt qua từng file ảnh trong danh sách
    for index, uploaded_file in enumerate(uploaded_files):
        # Cập nhật trạng thái tổng thể (Ví dụ: Đang chấm bài 1/5...)
        current_file_num = index + 1
        global_status.markdown(f"### 🔄 Đang xử lý bài số **{current_file_num}/{num_files}**: `{uploaded_file.name}`")

        # Đọc dữ liệu nhị phân của ảnh hiện tại
        file_bytes = np.asarray(bytearray(uploaded_file.read()), dtype=np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if img is None:
            st.error(f"Không thể đọc file: {uploaded_file.name}")
            continue  # Bỏ qua file lỗi, nhảy sang file tiếp theo

        # --- TIẾN TRÌNH XỬ LÝ LÕI ---
        warped = warp_process(img)

        if warped is not None:
            ans_blocks_data = find_answer_blocks(warped)
            list_ans = process_ans_blocks(ans_blocks_data)
            list_choices = process_list_ans(list_ans)

            # Nhận diện bằng CNN
            results = get_answers(list_choices, model_path=absolute_model_path)

            # Vẽ kết quả lên ảnh
            rs_img = process_and_draw_result(warped, results, ANSWERS_KEY)

            if rs_img is not None:
                # Chuyển đổi hệ màu để hiển thị
                rs_img_rgb = cv2.cvtColor(rs_img, cv2.COLOR_BGR2RGB)
                warped_rgb = cv2.cvtColor(warped, cv2.COLOR_BGR2RGB)

                # Dùng st.expander để gom kết quả của từng bài lại cho gọn gàng, không bị rối giao diện
                with st.expander(f"✅ Kết quả bài số {current_file_num}: {uploaded_file.name}", expanded=True):
                    # Hiển thị điểm số bằng văn bản (nếu bạn có hàm tính điểm)
                    # st.write("Điểm số: ...")

                    tab1, tab2 = st.tabs(["Ảnh Đã Chấm", "Ảnh Căn L Lề"])
                    with tab1:
                        st.image(rs_img_rgb, width='stretch')
                    with tab2:
                        st.image(warped_rgb, width='stretch')
            else:
                st.error(f"Lỗi: Không thể vẽ kết quả cho file {uploaded_file.name}")
        else:
            st.error(f"Lỗi: Căn lề thất bại (Warp process) cho file {uploaded_file.name}")

        # Cập nhật thanh tiến trình tổng thể sau khi xử lý xong 1 file
        progress_percentage = int((current_file_num / num_files) * 100)
        global_progress.progress(progress_percentage)
        time.sleep(0.1)  # Delay nhỏ tạo hiệu ứng chuyển mượt mà

    # Hoàn tất toàn bộ danh sách
    global_status.success(f"🎉 Đã hoàn thành chấm điểm toàn bộ {num_files} bài thi!")
    global_progress.empty()  # Dọn dẹp thanh tiến trình sau khi xong