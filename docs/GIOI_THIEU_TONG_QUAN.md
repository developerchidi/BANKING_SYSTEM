# 📱 CHIDI BANK - GIỚI THIỆU TỔNG QUAN SẢN PHẨM

## 1. Tên Ứng Dụng

**Chidi Bank** - Hệ thống Ngân hàng Số Chuyên nghiệp

Chidi Bank là ứng dụng ngân hàng số hiện đại, cung cấp giải pháp quản lý tài chính toàn diện với giao diện thân thiện và bảo mật cao. Ứng dụng hỗ trợ xác thực bằng Student ID cùng các phương thức truyền thống.

---

## 2. Mục Tiêu Của Ứng Dụng

Chidi Bank được phát triển để giúp người dùng:

- Quản lý tài chính cá nhân qua thiết bị di động
- Thực hiện giao dịch ngân hàng nhanh chóng, an toàn
- Theo dõi tài khoản và giao dịch theo thời gian thực
- Tích lũy qua các sản phẩm tiết kiệm với lãi suất hấp dẫn
- Xác thực danh tính điện tử (e-KYC) bằng CCCD/CMND

**Giá trị cốt lõi**: Tiện lợi, An toàn, Nhanh chóng, Minh bạch, Hiện đại

---

## 3. Công Nghệ Sử Dụng

### Mobile App (Frontend)
- **Framework**: Flutter 3.9.2+
- **State Management**: Provider Pattern
- **Tính năng**: QR Scanner, Camera (KYC), ML Kit, Notifications

### Backend API
- **Runtime**: Node.js + Express.js
- **Ngôn ngữ**: TypeScript
- **Database**: PostgreSQL (Prisma)
- **Authentication**: JWT (Access + Refresh Token)
- **Security**: bcrypt, Helmet, Rate Limiting
- **Real-time**: WebSocket
- **Email**: Nodemailer

### Kiến Trúc
```
Flutter App → Express.js API → PostgreSQL
```

---

## 4. Đối Tượng Sử Dụng

- **Người dùng cá nhân**: Quản lý tài chính, chuyển khoản, thanh toán
- **Người dùng mới**: Đăng ký đơn giản với KYC tự động
- **Người dùng trong môi trường giáo dục**: Hỗ trợ Student ID

**Phân quyền**: CUSTOMER, ADMIN, MANAGER, TELLER, CUSTOMER_SERVICE

---

## 5. Chức Năng Chính

### 5.1. Quản Lý Tài Khoản
Quản lý nhiều tài khoản (CHECKING, SAVINGS, BUSINESS), xem số dư real-time, sao kê, đóng băng/tạm ngưng, hạn mức giao dịch.

### 5.2. Giao Dịch Ngân Hàng
Chuyển khoản nội bộ/liên ngân hàng, thanh toán hóa đơn, QR Code Payment, lịch sử giao dịch, quản lý người thụ hưởng.

### 5.3. Xác Thực & Bảo Mật
Đăng ký/đăng nhập (Student ID hoặc Email), 2FA (SMS/Email/App), e-KYC (CCCD/CMND), quản lý phiên đăng nhập.

### 5.4. Quản Lý Thẻ
Tạo và quản lý thẻ Debit/Credit ảo, khóa/mở khóa, hạn mức chi tiêu, lịch sử giao dịch.

### 5.5. Tiết Kiệm & Lãi Suất
Tài khoản tiết kiệm, gửi có kỳ hạn (3/6/12/24 tháng), tính lãi tự động, lịch sử lãi, compound interest.

### 5.6. Tính Năng Khác
Hạng tài khoản (BASIC/STANDARD/PREMIUM/VIP), thông báo real-time, QR code, Dark/Light theme, đa ngôn ngữ.

---

## 6. Đặc Điểm Nổi Bật

- **Bảo mật đa lớp**: Mã hóa end-to-end, 2FA, session management, audit logs
- **Hiệu năng cao**: Real-time updates, caching thông minh, tối ưu database
- **Trải nghiệm tốt**: Material Design, navigation trực quan, responsive

---

## 7. Kết Luận

Chidi Bank là giải pháp ngân hàng số toàn diện với công nghệ hiện đại, bảo mật cao và trải nghiệm người dùng tuyệt vời. Ứng dụng tích hợp e-KYC tự động, QR payments, quản lý tiết kiệm thông minh và hỗ trợ đa dạng phương thức xác thực, sẵn sàng phục vụ hàng nghìn người dùng một cách ổn định và an toàn.

---

**Phiên bản**: 1.0 | **Ngày cập nhật**: 2025
