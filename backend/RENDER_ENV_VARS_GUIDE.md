# 🔐 Hướng Dẫn Điền Environment Variables trên Render

## 📝 Danh Sách Cần Điền

### 1. DATABASE_URL
**Cách điền:**
- **Option 1 (Khuyến nghị):** Render sẽ tự động sync khi deploy, để trống và click Apply trước
- **Option 2:** Sau khi tạo database, vào Dashboard → `banking-db` → Copy **Internal Database URL** → Paste vào đây

### 2. JWT_SECRET
- Click nút **"Generate"** bên cạnh để tự động tạo

### 3. JWT_REFRESH_SECRET
- Click nút **"Generate"** bên cạnh để tự động tạo

### 4. SMTP_MAIL
- Điền email Gmail của bạn (ví dụ: `your-email@gmail.com`)

### 5. SMTP_PASSWORD
- **Quan trọng:** Cần Gmail App Password, KHÔNG phải password thường
- **Cách lấy:**
  1. Vào [Google Account Security](https://myaccount.google.com/security)
  2. Bật 2-Step Verification (nếu chưa có)
  3. App Passwords → Generate new app password
  4. Chọn "Mail" và "Other" → Đặt tên "Render"
  5. Copy password 16 ký tự → Paste vào đây

### 6. FROM_EMAIL
- Thường giống với `SMTP_MAIL` (ví dụ: `your-email@gmail.com`)

### 7. SESSION_SECRET
- Click nút **"Generate"** bên cạnh để tự động tạo

### 8. API_KEY_SECRET
- Click nút **"Generate"** bên cạnh để tự động tạo

---

## ✅ Checklist Điền Form

- [ ] Blueprint Name: `chidi-bank-backend`
- [ ] Branch: `master`
- [ ] DATABASE_URL: Để trống (sẽ tự sync) HOẶC copy từ database sau
- [ ] JWT_SECRET: Click Generate
- [ ] JWT_REFRESH_SECRET: Click Generate
- [ ] SMTP_MAIL: Điền email Gmail
- [ ] SMTP_PASSWORD: Điền Gmail App Password (16 ký tự)
- [ ] FROM_EMAIL: Điền email (giống SMTP_MAIL)
- [ ] SESSION_SECRET: Click Generate
- [ ] API_KEY_SECRET: Click Generate

---

## 🚀 Sau Khi Điền Xong

1. Click **"Apply"** để bắt đầu deploy
2. Render sẽ tự động:
   - Tạo PostgreSQL database `banking-db`
   - Tạo Web Service `banking-backend`
   - Chạy migrations
   - Start server

---

## ⚠️ Lưu Ý

- Nếu thiếu Gmail App Password, email service sẽ không hoạt động
- DATABASE_URL sẽ được tự động sync nếu database được tạo trong cùng Blueprint
- Các secret keys (JWT, SESSION, API_KEY) phải là random strings để bảo mật

---

## 🆘 Nếu Gặp Lỗi

- **Email không gửi được:** Kiểm tra lại SMTP_PASSWORD (phải là App Password)
- **Database connection failed:** Kiểm tra DATABASE_URL đã đúng chưa
- **Build failed:** Kiểm tra logs trong Render Dashboard

