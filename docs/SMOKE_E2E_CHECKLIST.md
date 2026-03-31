---
name: Smoke E2E Java Flutter
overview: "Checklist smoke E2E tối thiểu: Java banking_core_java + Flutter chidi_bank."
todos: []
isProject: false
---

# Smoke E2E — Java BE + Flutter FE

**Điều kiện:** PostgreSQL + Redis chạy; biến môi trường `.env` hoặc env shell khớp `application.yml` (JWT, DB, Redis). Backend: cổng mặc định **3001**. Flutter: mặc định `127.0.0.1:3001` hoặc `--dart-define=API_HOST=... --dart-define=API_PORT=3001` / `--dart-define=API_BASE_URL=https://...`

## 1. Backend

1. `./gradlew test` — toàn bộ test pass.
2. Khởi chạy app và kiểm tra `GET /actuator/health` (200, DB + Redis nếu bật).
3. `POST /api/auth/register` + `POST /api/auth/login` — nhận access + refresh; session ghi DB.
4. `POST /api/auth/refresh` với refresh hợp lệ — token mới; refresh cũ không tái sử dụng (session rotate).
5. Gọi API có JWT sau `POST /api/auth/logout` với Bearer — bị từ chối nếu token đã blacklist (nếu đã gửi access token khi logout).
6. Rate limit: gửi liên tục `POST` login/transfer — sau ngưỡng nhận **429** (Redis).

## 2. Flutter

1. `flutter test` pass.
2. Đăng nhập → dashboard tải được (accounts/transactions không lỗi 401 vòng lặp).
3. Token lưu **secure storage** (release không log token trong console).
4. (Tuỳ chọn) Build `flutter build apk --release` và xác nhận không có `debugPrint` lộ token (đã bọc `kDebugMode` ở luồng chính).

## 3. Nghiệp vụ (parity)

1. User **KYC chưa VERIFIED** — chuyển tiền / tạo thẻ bị từ chối với mã `KYC_REQUIRED`.
2. Chuyển tiền vượt **daily/monthly limit** trên tài khoản — `DAILY_LIMIT_EXCEEDED` / `MONTHLY_LIMIT_EXCEEDED`.
3. API danh sách thẻ — `cardNumber` dạng mask (không trả full PAN); không có CVV trong JSON.
