# Account Number & Name Migration Guide

## Tổng quan
Refactor số tài khoản từ format có chữ (`ACC1234567890`) sang format chỉ có số (12 chữ số) và cập nhật tên tài khoản từ `Nguyen's Checking Account` thành `NGUYEN THANH LOC` (không dấu, viết in hoa).

## Những thay đổi đã thực hiện

### 1. Cập nhật hàm generateAccountNumber
- **File**: `backend/src/services/database.service.ts`
- **Thay đổi**: Tạo số tài khoản 12 chữ số (chỉ số, không có chữ)
- **Format mới**: `123456789012` (12 chữ số)

### 2. Cập nhật hàm formatUserName
- **File**: `backend/src/services/database.service.ts`
- **Thay đổi**: Format tên người dùng thành uppercase không dấu
- **Format mới**: `NGUYEN THANH LOC` (từ "Nguyễn Thành Lộc")

### 3. Cập nhật validation
- **File**: `backend/src/controllers/banking.controller.ts`
- **Thay đổi**: Validation cho số tài khoản chỉ chấp nhận 6-12 chữ số

### 4. Cập nhật AuthService
- **File**: `backend/src/services/auth.service.ts`
- **Thay đổi**: Sử dụng `DatabaseService.formatUserName()` cho account name

### 5. Cập nhật AccountService
- **File**: `backend/src/services/account.service.ts`
- **Thay đổi**: Sử dụng DatabaseService.generateAccountNumber() thay vì hàm riêng

## Scripts Migration

### 1. Script Migration Account Numbers
```bash
# Chạy script migration để cập nhật tất cả account numbers hiện có
cd backend
npx ts-node scripts/migrate-account-numbers.ts
```

### 2. Script Migration Account Names
```bash
# Chạy script migration để cập nhật tất cả account names hiện có
cd backend
npx ts-node scripts/migrate-account-names.ts
```

### 3. Script Test Account Numbers
```bash
# Test hàm generateAccountNumber mới
cd backend
npx ts-node scripts/test-account-numbers.ts
```

### 4. Script Test Account Names
```bash
# Test hàm formatUserName mới
cd backend
npx ts-node scripts/test-account-names.ts
```

## Workflow Migration

### Bước 1: Backup Database
```bash
# Backup database trước khi migration
cp backend/prisma/dev.db backend/prisma/dev.db.backup
```

### Bước 2: Chạy Migration Account Numbers
```bash
cd backend
npx ts-node scripts/migrate-account-numbers.ts
```

### Bước 3: Chạy Migration Account Names
```bash
cd backend
npx ts-node scripts/migrate-account-names.ts
```

### Bước 4: Test Workflow
```bash
# Test tạo account numbers mới
npx ts-node scripts/test-account-numbers.ts

# Test format account names mới
npx ts-node scripts/test-account-names.ts

# Test API endpoints
curl -X GET "http://localhost:3001/api/banking/verify-account/123456789012"
```

## Validation Rules

### Số tài khoản hợp lệ:
- ✅ Chỉ chứa số (0-9)
- ✅ Độ dài: 6-12 chữ số
- ✅ Unique trong database

### Tên tài khoản hợp lệ:
- ✅ Không dấu (Nguyễn → NGUYEN)
- ✅ Viết in hoa (thanh → THANH)
- ✅ Format: `NGUYEN THANH LOC`

### Số tài khoản không hợp lệ:
- ❌ Chứa chữ cái: `ACC1234567890`
- ❌ Quá ngắn: `12345` (< 6 chữ số)
- ❌ Quá dài: `1234567890123` (> 12 chữ số)
- ❌ Chứa ký tự đặc biệt: `123-456-789`

### Tên tài khoản không hợp lệ:
- ❌ Có dấu: `Nguyễn Thành Lộc`
- ❌ Viết thường: `nguyen thanh loc`
- ❌ Có ký tự đặc biệt: `Nguyen's Account`

## API Endpoints Affected

### 1. Verify Account Number
```
GET /api/banking/verify-account/:accountNumber
```
- **Validation**: Chỉ chấp nhận 6-12 chữ số
- **Response**: Thông tin tài khoản nếu hợp lệ

### 2. Transfer Money
```
POST /api/banking/transfer
```
- **Body**: `toAccountNumber` phải là số tài khoản hợp lệ
- **Validation**: Sử dụng cùng validation rules

## Testing Checklist

- [ ] Migration account numbers script chạy thành công
- [ ] Migration account names script chạy thành công
- [ ] Tất cả account numbers cũ được cập nhật
- [ ] Tất cả account names cũ được cập nhật
- [ ] Không có duplicate account numbers
- [ ] API verify-account hoạt động với format mới
- [ ] Transfer money hoạt động với account numbers mới
- [ ] Tạo account mới sử dụng format mới
- [ ] Frontend hiển thị account numbers đúng format
- [ ] Frontend hiển thị account names đúng format

## Rollback Plan

Nếu cần rollback:
1. Restore database từ backup
2. Revert code changes
3. Chạy lại migration với format cũ

## Notes

- Account numbers mới sẽ có format: `123456789012` (12 chữ số)
- Account names mới sẽ có format: `NGUYEN THANH LOC` (không dấu, in hoa)
- Migration scripts sẽ tự động generate unique numbers và format names
- Tất cả API endpoints đã được cập nhật để hỗ trợ format mới
- Frontend không cần thay đổi vì chỉ hiển thị account number và name
- Hàm `formatUserName()` hỗ trợ tiếng Việt và các ngôn ngữ khác
