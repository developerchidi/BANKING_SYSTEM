# ⚡ Quick Switch Guide - Chuyển đổi IP nhanh chóng

## 🎯 Cách thay đổi IP trong 30 giây

### **Bước 1: Mở file environments**
```
mobile-app/src/config/environments.ts
```

### **Bước 2: Chọn môi trường**
```typescript
// Thay đổi dòng này:
export const CURRENT_ENVIRONMENT = ENVIRONMENTS.CURRENT;

// Thành một trong các lựa chọn:
export const CURRENT_ENVIRONMENT = ENVIRONMENTS.HOME;     // Ở nhà
export const CURRENT_ENVIRONMENT = ENVIRONMENTS.OFFICE;   // Ở công ty  
export const CURRENT_ENVIRONMENT = ENVIRONMENTS.LOCAL;    // Localhost
export const CURRENT_ENVIRONMENT = ENVIRONMENTS.PRODUCTION; // Production
```

### **Bước 3: Restart app**
```bash
npm start
# hoặc
expo start
```

## 🌍 Các môi trường có sẵn

| Môi trường | IP/URL | Mô tả |
|------------|--------|-------|
| `CURRENT` | `192.168.31.39:3001` | Mạng hiện tại |
| `HOME` | `192.168.1.100:3001` | Mạng LAN ở nhà |
| `OFFICE` | `10.0.0.50:3001` | Mạng LAN ở công ty |
| `LOCAL` | `localhost:3001` | Development local |
| `PRODUCTION` | `api.bankingsystem.com` | Server production |

## 🔧 Tùy chỉnh IP mới

Nếu IP của bạn khác, thêm vào file `environments.ts`:

```typescript
export const ENVIRONMENTS = {
  // ... các môi trường khác
  
  // Thêm môi trường mới
  MY_NETWORK: {
    name: 'My Network',
    baseUrl: 'http://YOUR_IP:3001',
    description: 'Mạng của tôi'
  },
};

// Sử dụng môi trường mới
export const CURRENT_ENVIRONMENT = ENVIRONMENTS.MY_NETWORK;
```

## ✅ Kiểm tra kết nối

Sau khi thay đổi, kiểm tra trong console:
```
🌐 API POST: http://YOUR_IP:3001/api/auth/login
✅ API POST Response: http://YOUR_IP:3001/api/auth/login {...}
```

## 🚨 Troubleshooting

### **Lỗi kết nối**
- Kiểm tra IP có đúng không
- Kiểm tra backend có chạy không
- Kiểm tra firewall/antivirus

### **Lỗi import**
- Restart Metro bundler: `expo start --clear`
- Kiểm tra file paths

### **Lỗi TypeScript**
- Restart TypeScript server trong IDE
- Chạy `npx tsc --noEmit` để check errors

---

**💡 Pro Tip**: Tạo alias trong IDE để mở nhanh file config:
- VS Code: `Ctrl+Shift+P` → "Preferences: Open Keyboard Shortcuts"
- Thêm shortcut cho file `environments.ts` 