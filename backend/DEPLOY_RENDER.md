# 🚀 Hướng Dẫn Deploy Backend Lên Render

Hướng dẫn chi tiết để deploy Banking System Backend lên Render.com.

## 📋 Yêu Cầu

- Tài khoản Render.com
- Repository GitHub/GitLab đã được push code
- PostgreSQL database (có thể tạo trên Render hoặc dùng external)

---

## 🔧 Bước 1: Tạo PostgreSQL Database trên Render

1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Cấu hình:
   - **Name**: `banking-db`
   - **Database**: `banking_system`
   - **User**: `banking_user`
   - **Region**: Chọn region gần bạn (Singapore, Oregon, etc.)
   - **Plan**: Starter (free tier) hoặc Standard
4. Click **"Create Database"**
5. Sau khi tạo xong, lấy **Internal Database URL** từ trang database details

---

## 🌐 Bước 2: Tạo Web Service

1. Trong Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect repository của bạn (GitHub/GitLab)
3. Cấu hình:
   - **Name**: `banking-backend`
   - **Region**: Cùng region với database
   - **Branch**: `master` hoặc `main`
   - **Root Directory**: `backend` (nếu code backend nằm trong folder `backend`)
   - **Runtime**: `Node`
   - **Build Command**: 
     ```bash
     npm install && npx prisma generate && npm run build
     ```
   - **Start Command**:
     ```bash
     npm run db:deploy && npm start
     ```
   - **Instance Type**: Free hoặc Starter

---

## ⚙️ Bước 3: Cấu Hình Environment Variables

Trong trang Web Service settings, vào **"Environment"** tab và thêm các biến sau:

### Database
```
DATABASE_URL=<Internal Database URL từ Render PostgreSQL>
```
⚠️ **Lưu ý**: Dùng **Internal Database URL** để kết nối từ Render service đến Render database (nhanh hơn và không tính phí bandwidth)

### Authentication
```
JWT_SECRET=<your-super-secret-jwt-key-change-this-in-production>
JWT_REFRESH_SECRET=<your-refresh-token-secret-change-this-in-production>
SESSION_SECRET=<your-session-secret-change-this-in-production>
API_KEY_SECRET=<your-api-key-secret>
```

### Email Configuration
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_MAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_NAME=CHIDI BANK
FROM_EMAIL=your-email@gmail.com
```

### Server Configuration
```
NODE_ENV=production
PORT=3001
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### Optional (Nếu cần)
```
FRONTEND_URL=https://your-frontend-domain.com
MONGODB_URI=<mongodb-connection-string> (nếu dùng MongoDB)
CLOUDINARY_URL=<cloudinary-url> (nếu dùng Cloudinary)
```

---

## 🔒 Bước 4: Tạo Secret Keys

Để tạo các secret keys an toàn:

```bash
# Trên terminal, chạy:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Chạy lệnh này 4 lần để tạo:
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `SESSION_SECRET`
- `API_KEY_SECRET`

---

## 📧 Bước 5: Cấu Hình Gmail App Password

1. Vào [Google Account Settings](https://myaccount.google.com/)
2. Security → 2-Step Verification (bật nếu chưa có)
3. App Passwords → Generate new app password
4. Chọn app: "Mail" và device: "Other"
5. Copy password và paste vào `SMTP_PASSWORD`

---

## 🚀 Bước 6: Deploy

1. Click **"Save Changes"** trong Environment variables
2. Render sẽ tự động trigger build và deploy
3. Đợi build hoàn thành (thường 3-5 phút)
4. Sau khi deploy thành công, bạn sẽ có URL như: `https://banking-backend.onrender.com`

---

## ✅ Bước 7: Verify Deployment

1. Kiểm tra health endpoint:
   ```
   GET https://your-app.onrender.com/health
   ```

2. Kiểm tra API info:
   ```
   GET https://your-app.onrender.com/api
   ```

3. Kiểm tra logs trong Render Dashboard để đảm bảo không có lỗi

---

## 🔍 Troubleshooting

### Build Failed
- **Lỗi**: Prisma generate failed
  - **Giải pháp**: Đảm bảo `render.yaml` có `npx prisma generate` trong build command

### Database Connection Failed
- **Lỗi**: Connection timeout
  - **Giải pháp**: Dùng **Internal Database URL** thay vì External URL
  - Kiểm tra database đã được tạo chưa

### Migration Failed
- **Lỗi**: Migration errors
  - **Giải pháp**: Chạy `npm run db:deploy` trong start command để chạy migrations

### Email Not Sending
- **Lỗi**: Email service không hoạt động
  - **Giải pháp**: 
    - Kiểm tra Gmail App Password đã đúng chưa
    - Đảm bảo đã bật 2-Step Verification
    - Kiểm tra `SMTP_MAIL` và `SMTP_PASSWORD` đã được set

### Port Error
- **Lỗi**: Port already in use
  - **Giải pháp**: Render tự động set PORT, không cần config trong code. Đảm bảo code sử dụng `process.env.PORT`

---

## 📝 Notes

1. **Auto-Deploy**: Render tự động deploy khi có push lên branch được cấu hình
2. **Free Tier**: Render free tier có thể sleep sau 15 phút không dùng. Upgrade để tránh sleep
3. **Database**: Render PostgreSQL free tier có giới hạn, cân nhắc upgrade nếu cần
4. **Logs**: Xem logs real-time trong Render Dashboard → Logs tab
5. **Custom Domain**: Có thể thêm custom domain trong Settings → Custom Domains

---

## 🔗 Useful Links

- Render Documentation: https://render.com/docs
- Prisma Deploy Guide: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-render
- Render Status: https://status.render.com

---

## 📞 Support

Nếu gặp vấn đề, kiểm tra:
1. Render logs trong Dashboard
2. Environment variables đã được set đầy đủ
3. Database connection string đúng format
4. Build logs để xem lỗi cụ thể

---

**Happy Deploying! 🚀**

