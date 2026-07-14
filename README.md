# PetCareHub

PetCareHub là một nền tảng chăm sóc thú cưng thông minh, tích hợp trí tuệ nhân tạo để hỗ trợ quản lý thông tin thú cưng, dịch vụ chăm sóc và chẩn đoán bằng AI. Dự án kết hợp đầy đủ các thành phần: backend, frontend và mô-đun machine learning để mang đến trải nghiệm toàn diện cho người dùng và quản trị viên.

## Tóm tắt dự án

PetCareHub tập trung vào việc cung cấp:

- Quản lý thông tin thú cưng và hồ sơ người dùng
- Đặt lịch khám, chăm sóc và các dịch vụ liên quan
- Tích hợp AI để hỗ trợ nhận diện giống thú cưng và phân tích bệnh lý
- Giao diện người dùng hiện đại, thân thiện và dễ sử dụng
- Hệ thống quản trị cho việc vận hành và duy trì dịch vụ

## Công nghệ sử dụng

- Backend: NestJS, TypeScript
- Frontend: React, Vite, Tailwind CSS
- AI Module: Python, PyTorch
- Database: MySQL / PostgreSQL
- Containerization: Docker

## Cấu trúc dự án

- backend/: API server và logic nghiệp vụ
- frontend/: giao diện người dùng
- AI/: mô-đun huấn luyện, inference và API phục vụ AI

## Yêu cầu hệ thống

- Node.js 18+ 
- Python 3.10+
- npm hoặc yarn
- Docker (tùy chọn, để chạy trong container)
- Cơ sở dữ liệu MySQL hoặc PostgreSQL

## Cài đặt

### 1. Cài đặt backend

```bash
cd backend
npm install
```

### 2. Cài đặt frontend

```bash
cd frontend
npm install
```

### 3. Cài đặt mô-đun AI

```bash
cd AI
pip install -r requirements.txt
```

## Chạy ứng dụng

### Backend

```bash
cd backend
npm run start:dev
```

### Frontend

```bash
cd frontend
npm run dev
```

### AI Server

```bash
cd AI
python api_server.py
```

## Môi trường cấu hình

Trước khi chạy ứng dụng, hãy đảm bảo các biến môi trường cần thiết được cấu hình phù hợp cho backend và database. Nếu dự án có file cấu hình mẫu, vui lòng sao chép và chỉnh sửa theo môi trường của bạn.

## Đóng góp

Mọi đóng góp đều được hoan nghênh. Nếu bạn muốn đóng góp, hãy tạo pull request hoặc mở issue để trao đổi trước khi thực hiện thay đổi lớn.

## Ghi chú

Dự án này đang được phát triển và có thể tiếp tục được cải tiến về tính năng, hiệu suất và độ ổn định.

