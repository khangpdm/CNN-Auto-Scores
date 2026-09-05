# ASC Marker

ASC Marker là hệ thống chấm bài thi trắc nghiệm từ ảnh phiếu trả lời. Ứng dụng hỗ trợ giáo viên quản lý kỳ thi, nhập danh sách thí sinh và đáp án, tải ảnh bài làm để hệ thống nhận diện số báo danh, mã đề, đáp án và tự động tổng hợp điểm.

## Truy cập hệ thống

- Ứng dụng: [asc-marker.vercel.app](https://asc-marker.vercel.app)
- API: [asc-marker.onrender.com](https://asc-marker.onrender.com)
- Tài liệu API tương tác: [asc-marker.onrender.com/docs](https://asc-marker.onrender.com/docs)
- Video minh họa: [Demo_asc.mp4](Demo_asc.mp4)

## Chức năng chính

- Đăng ký, đăng nhập, cập nhật hồ sơ và bảo vệ các trang cần xác thực bằng JWT.
- Tạo, cập nhật và quản lý nhiều kỳ thi, nhiều đợt thi trong mỗi kỳ thi.
- Nhập danh sách thí sinh từ Excel hoặc thêm, sửa, xóa thủ công.
- Nhập đáp án theo từng mã đề từ Excel hoặc thiết lập trực tiếp, hỗ trợ điểm riêng cho từng câu.
- Tải lên một ảnh, nhiều ảnh hoặc tệp ZIP chứa bài thi để chấm hàng loạt.
- Căn chỉnh phiếu, nhận diện số báo danh, mã đề và ô đáp án bằng xử lý ảnh kết hợp mô hình CNN.
- Hiển thị ảnh bài làm đã đánh dấu đáp án đúng, sai hoặc bỏ trống; cho phép chỉnh sửa kết quả thủ công.
- Theo dõi tiến độ các lô chấm và xuất bảng điểm tổng hợp ra Excel.

## Quy trình sử dụng

1. Tạo tài khoản và đăng nhập.
2. Vào **Kỳ thi**, nhập danh sách số báo danh thí sinh cho kỳ thi.
3. Tạo một hoặc nhiều đợt thi, tương ứng với từng đề thi/lần tổ chức.
4. Trong đợt thi, nạp đáp án theo mã đề và tải ảnh bài làm của học sinh để chấm.
5. Kiểm tra kết quả, điều chỉnh thủ công nếu cần, rồi xuất bảng điểm Excel.

Mẫu Excel và phiếu trả lời có trong thư mục [`Samples`](Samples). Mẫu dùng trực tiếp trên giao diện cũng được cung cấp tại [Google Drive](https://drive.google.com/drive/folders/1p-syZ-YsEzwCXVWbSUumMVD6HxwCPHdG?usp=sharing).

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS, Axios, React Router |
| Backend | Python 3.11, FastAPI, SQLAlchemy, Uvicorn |
| Nhận diện phiếu | OpenCV, TensorFlow/Keras, mô hình CNN |
| Cơ sở dữ liệu | PostgreSQL khi triển khai; SQLite mặc định ở môi trường cục bộ |
| Triển khai | Vercel (frontend), Render (backend) |

## Cấu trúc dự án

```text
.
├── backend/app/
│   ├── routers/          # API xác thực, kỳ thi, đáp án, thí sinh, chấm điểm, kết quả
│   ├── services/         # Xử lý ảnh, nhận diện, chấm điểm và Excel
│   ├── database/         # Kết nối và mô hình dữ liệu
│   ├── weights/          # Trọng số mô hình CNN
│   └── app.py            # Điểm khởi chạy FastAPI
├── frontend/
│   └── src/              # Giao diện React
├── Samples/              # Ảnh phiếu và tệp Excel mẫu
├── datasets/             # Dữ liệu huấn luyện lựa chọn/không lựa chọn
└── Demo_asc.mp4          # Video minh họa
```

## Chạy cục bộ

### Yêu cầu

- Python 3.11
- Node.js 20 trở lên và npm

### Backend

```bash
cd backend/app
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload
```

API chạy mặc định tại `http://localhost:8000`; tài liệu Swagger có tại `http://localhost:8000/docs`.

Nếu không cấu hình `DATABASE_URL`, backend tự tạo và dùng SQLite tại `backend/app/database/app_data.db`. Để dùng PostgreSQL, tạo `backend/app/.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Tạo `frontend/.env.local` để frontend gọi đúng API cục bộ hoặc API đã triển khai:

```env
VITE_API_URL=http://localhost:8000
```

Sau đó mở địa chỉ Vite hiển thị trong terminal, thông thường là `http://localhost:5173`.

## Lệnh hữu ích

```bash
# Kiểm tra quy tắc mã nguồn frontend
cd frontend && npm run lint

# Tạo bản build frontend để triển khai
cd frontend && npm run build
```

## Lưu ý triển khai

- Frontend đã cấu hình SPA rewrite trong [`frontend/vercel.json`](frontend/vercel.json) để các tuyến như `/ky-thi` hoạt động khi tải lại trang.
- Backend cho phép origin của ứng dụng Vercel và môi trường cục bộ qua CORS.
- Không đưa tệp `.env`, chuỗi kết nối cơ sở dữ liệu hoặc khóa bí mật lên repository.

## API tiêu biểu

| Nhóm | Đường dẫn |
| --- | --- |
| Xác thực | `/api/v1/auth` |
| Kỳ thi và đợt thi | `/api/v1/exams` |
| Thí sinh | `/api/v1/session/{session_id}/students` |
| Đáp án | `/api/v1/session/{session_id}/answers` |
| Chấm bài | `/api/v1/grading/sessions/{session_id}/scan` |
| Kết quả và xuất Excel | `/api/v1/sessions/{session_id}/results`, `/api/v1/sessions/{session_id}/export-excel` |

Xem đầy đủ tham số, yêu cầu xác thực và phản hồi tại trang `/docs` của API.
