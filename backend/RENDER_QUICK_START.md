# ⚡ Quick Start - Deploy lên Render (Tóm Tắt)

## 🎯 3 Bước Deploy

### 1️⃣ Tạo PostgreSQL Database
- Dashboard → New + → PostgreSQL
- Name: `banking-db`
- Copy **Internal Database URL**

### 2️⃣ Tạo Web Service
- Dashboard → New + → Web Service
- Connect repository
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm run db:deploy && npm start`
- **Root Directory**: `backend` (nếu backend nằm trong folder `backend`)

### 3️⃣ Set Environment Variables
Copy và paste vào Environment tab:

```bash
# Database (BẮT BUỘC)
DATABASE_URL=<Internal Database URL từ Render>

# JWT Secrets (BẮT BUỘC - tạo bằng: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=<generate-random-hex>
JWT_REFRESH_SECRET=<generate-random-hex>
SESSION_SECRET=<generate-random-hex>
API_KEY_SECRET=<generate-random-hex>

# Email (BẮT BUỘC nếu dùng email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_MAIL=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
FROM_NAME=CHIDI BANK
FROM_EMAIL=your-email@gmail.com

# Server (Tùy chọn)
NODE_ENV=production
PORT=3001
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

---

## 🔑 Tạo Secret Keys

Chạy lệnh này 4 lần trong terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📧 Gmail App Password

1. Google Account → Security → 2-Step Verification (bật)
2. App Passwords → Generate
3. Copy password → paste vào `SMTP_PASSWORD`

---

## ✅ Kiểm Tra

Sau khi deploy xong, test:
```
https://your-app.onrender.com/health
https://your-app.onrender.com/api
```

---

**Xem chi tiết trong `DEPLOY_RENDER.md`** 📖

