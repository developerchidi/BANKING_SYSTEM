# 🔧 API Configuration Guide

## 📍 Cách thay đổi IP API

### **Trước đây (Cũ)**
Bạn phải thay đổi IP ở nhiều file:
- `src/services/authService.ts`
- `src/services/bankingService.ts`
- Và có thể nhiều file khác...

### **Bây giờ (Mới)**
Chỉ cần thay đổi IP ở **1 file duy nhất**:
```typescript
// File: src/config/environments.ts
export const CURRENT_ENVIRONMENT = ENVIRONMENTS.HOME; // ← Chọn môi trường ở đây
```

### **Hoặc thay đổi trực tiếp IP:**
```typescript
// File: src/config/api.ts
export const API_CONFIG = {
  BASE_URL: 'http://192.168.31.39:3001', // ← Thay đổi IP ở đây
  // ...
};
```

## 🚀 Cách sử dụng

### **1. Thay đổi IP khi cần**
```typescript
// Mở file: mobile-app/src/config/api.ts
// Thay đổi dòng này:
BASE_URL: 'http://YOUR_NEW_IP:3001',
```

### **2. Ví dụ các IP khác nhau**
```typescript
// Ở nhà (LAN)
BASE_URL: 'http://192.168.1.100:3001',

// Ở công ty (LAN)
BASE_URL: 'http://10.0.0.50:3001',

// Localhost (development)
BASE_URL: 'http://localhost:3001',

// Production
BASE_URL: 'https://api.bankingsystem.com',
```

### **3. Các endpoint tự động được cập nhật**
- Auth: `BASE_URL + /api/auth`
- 2FA: `BASE_URL + /api/2fa`
- Banking: `BASE_URL + /api/banking`
- User: `BASE_URL + /api/user`

## 🔍 Debug & Logging

### **Bật/tắt logging**
```typescript
// File: src/config/api.ts
export const API_CONFIG = {
  // ...
  LOG_API_CALLS: true, // ← Bật/tắt logging
  DEBUG: true,         // ← Bật/tắt debug mode
};
```

### **Xem logs trong console**
```
🌐 API POST: http://192.168.31.39:3001/api/auth/login Data: {"email":"..."}
✅ API POST Response: http://192.168.31.39:3001/api/auth/login {...}
❌ API GET Error: http://192.168.31.39:3001/api/banking/accounts {...}
```

## 📁 File Structure

```
mobile-app/
├── src/
│   ├── config/
│   │   └── api.ts          ← File config chính
│   └── services/
│       ├── authService.ts  ← Sử dụng config
│       └── bankingService.ts ← Sử dụng config
├── env.example             ← Template cho .env (nếu cần)
└── API_CONFIG_README.md    ← File này
```

## ⚡ Lợi ích

✅ **Dễ dàng thay đổi IP**: Chỉ cần sửa 1 file  
✅ **Tự động logging**: Xem được tất cả API calls  
✅ **Debug friendly**: Dễ debug khi có lỗi  
✅ **Consistent**: Tất cả services dùng chung config  
✅ **Maintainable**: Code dễ bảo trì hơn  

## 🎯 Quick Start

1. **Thay đổi IP**: Sửa `BASE_URL` trong `src/config/api.ts`
2. **Restart app**: `npm start` hoặc `expo start`
3. **Kiểm tra**: Xem logs trong console để đảm bảo kết nối thành công

---

**💡 Tip**: Nếu bạn thường xuyên thay đổi giữa các môi trường, có thể tạo nhiều config profiles:
```typescript
const ENVIRONMENTS = {
  HOME: 'http://192.168.1.100:3001',
  OFFICE: 'http://10.0.0.50:3001',
  LOCAL: 'http://localhost:3001',
};

export const API_CONFIG = {
  BASE_URL: ENVIRONMENTS.HOME, // ← Chọn môi trường ở đây
  // ...
};
``` 