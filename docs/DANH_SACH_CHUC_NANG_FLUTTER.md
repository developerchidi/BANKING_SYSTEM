# 📱 DANH SÁCH CHỨC NĂNG TRÊN GIAO DIỆN FLUTTER APP

## 🏠 MAIN NAVIGATION (Bottom Bar)
Ứng dụng có 5 tab chính ở bottom navigation:

1. **Trang chủ** (Dashboard) - `DashboardScreen`
2. **Giao dịch** (Transactions) - `TransactionsScreen`
3. **Chuyển tiền** (Transfer) - `TransferTypeScreen`
4. **Thẻ** (Cards) - `CardsListScreen`
5. **Tài khoản** (Profile) - `ProfileScreen`

---

## 🔐 AUTHENTICATION & SECURITY

### Đăng nhập & Đăng ký
- **Login Screen** (`login_screen.dart`)
  - Nhập Mã số sinh viên + Mật khẩu (có nút hiện/ẩn mật khẩu)
  - Kiểm tra hợp lệ form, gửi bằng nút hoặc phím Enter
  - Hiển thị trạng thái đang tải, hiển thị lỗi nếu thất bại
  - Nếu có 2FA → chuyển sang màn hình xác thực 2FA
  - Nếu không có 2FA → đăng nhập thành công và vào ứng dụng chính
  - Liên kết "Quên mật khẩu?" và "Đăng ký" tài khoản mới
  - Giao diện: Nền gradient, thiết kế đáp ứng, danh sách tính năng

- **Registration Screen** (`registration_screen.dart`)
  - Đăng ký qua 6 bước (form nhiều bước):
    - **Bước 1**: Họ tên
    - **Bước 2**: Ngày sinh (dd/mm/yyyy), Giới tính, Quốc tịch
    - **Bước 3**: Email, Số điện thoại (kiểm tra trùng lặp email và mã số sinh viên)
    - **Bước 4**: Mã số sinh viên, Khoa/Nhóm, Trường (kiểm tra mã số sinh viên trong hệ thống)
    - **Bước 5**: Địa chỉ hiện tại, Địa chỉ thường trú, Liên hệ khẩn cấp
    - **Bước 6**: Mật khẩu, Xác nhận mật khẩu, Đồng ý điều khoản
  - Kiểm tra hợp lệ từng bước, có nút Quay lại/Tiếp theo, hiển thị trạng thái đang tải
  - Sau khi đăng ký thành công → tự động đăng nhập và chuyển vào ứng dụng chính
  - Có hộp thoại xem Điều khoản sử dụng và Chính sách bảo mật

- **Two Factor Screen** (`two_factor_screen.dart`)
  - Nhập mã 2FA (6 chữ số) qua 6 ô input (auto-focus), tự động gửi mã khi vào màn hình
  - Hiển thị email được mask để xác nhận (ví dụ: u***@g***.com)
  - Nút "Gửi lại mã" nếu chưa nhận được
  - Xác thực mã với server → sau khi thành công vào ứng dụng chính

### Quản lý mật khẩu

- **Forgot Password** (3 bước):
  1. **Forgot Password Screen**: Nhập email → gửi mã xác nhận 6 số qua email
  2. **Verify Reset Code Screen**: Nhập mã 6 số từ email → xác thực với server
  3. **Reset Password Screen**: Đặt mật khẩu mới (có nút hiện/ẩn cho cả 2 trường) → validation đầy đủ (8+ ký tự, chữ hoa/thường/số/ký tự đặc biệt) → đặt lại thành công và chuyển về đăng nhập

---

## 📊 DASHBOARD (Trang chủ)

### **Dashboard Screen** (`dashboard_screen.dart`)

#### Header (Top Bar)
- Greeting message (Chào buổi sáng/trưa/chiều/tối)
- Tên người dùng
- KYC Status badge (KYC ✓ hoặc KYC ⚠)
- Account Tier badge (STANDARD/PREMIUM/VIP - nếu không phải BASIC)
- Avatar/Profile icon

#### Hiển thị thông tin
- **Tổng số dư tất cả tài khoản**
  - Hiển thị/Ẩn số dư (toggle button)
  - Format VND với dấu phẩy
  - Animation khi toggle

- **Danh sách tài khoản** (Accounts)
  - Hiển thị tất cả tài khoản của user
  - Thông tin: Số tài khoản, Tên tài khoản, Số dư, Loại tài khoản
  - Tap để xem chi tiết
  - QR Code button cho mỗi tài khoản

- **Giao dịch gần đây** (Recent Transactions)
  - Hiển thị 10 giao dịch mới nhất
  - Thông tin: Loại giao dịch, Số tiền, Ngày giờ, Trạng thái
  - Màu sắc phân biệt (xanh = nhận, đỏ = gửi)
  - Tap để xem chi tiết giao dịch
  - "Xem tất cả" button

- **Thẻ của tôi** (My Cards)
  - Hiển thị danh sách thẻ (Debit/Credit)
  - Thông tin: Số thẻ (masked), Loại thẻ, Trạng thái
  - Tap để xem chi tiết thẻ

- **KYC Status Banner**
  - Hiển thị trạng thái KYC (PENDING/APPROVED/REJECTED)
  - Banner cảnh báo nếu chưa KYC hoặc bị từ chối
  - Button "Xác thực KYC" nếu chưa verify

#### Thao tác nhanh (Quick Actions)
1. **Chuyển tiền** - Mở màn hình chuyển tiền (yêu cầu KYC)
2. **Lịch sử** - Xem lịch sử giao dịch đầy đủ
3. **Thẻ** - Quản lý thẻ (yêu cầu KYC)
4. **Lãi suất** - Xem thông tin lãi suất tiết kiệm

#### Tính năng khác
- Pull to refresh để làm mới dữ liệu
- Cache thông minh (5 phút)
- QR Code của tài khoản (từ menu)
- Greeting message thay đổi theo thời gian

---

## 💸 TRANSACTION MANAGEMENT

### **Transactions Screen** (`transactions_screen.dart`)
- Hiển thị danh sách tất cả giao dịch
- Filter theo:
  - Loại giao dịch (Transfer, Deposit, Withdrawal, etc.)
  - Trạng thái (Pending, Completed, Failed)
  - Tài khoản
  - Khoảng thời gian
- Search giao dịch
- Phân trang (pagination)
- Pull to refresh

### **Transaction History Screen** (`transaction_history_screen.dart`)
- Lịch sử giao dịch chi tiết
- Filter và search nâng cao
- Export dữ liệu

### **Transaction Detail Screen** (`transaction_detail_screen.dart`)
- Chi tiết một giao dịch cụ thể:
  - Thông tin giao dịch (Số giao dịch, Ngày giờ)
  - Số tiền và phí
  - Tài khoản gửi/nhận
  - Mô tả/Nội dung
  - Trạng thái và thời gian xử lý
  - Reference number

---

## 💰 TRANSFER (Chuyển tiền)

### **Transfer Type Screen** (`transfer_type_screen.dart`)
- Chọn loại chuyển tiền:
  1. **Người thụ hưởng đã lưu** (Saved Beneficiaries)
     - Danh sách người nhận đã lưu
     - Search và filter
     - Xóa người thụ hưởng (swipe to delete)
  2. **Chuyển tiền gần đây** (Recent Transfers)
     - Danh sách người nhận từ lịch sử giao dịch
     - Hiển thị ngày chuyển tiền gần nhất
  3. **Quét QR Code**
     - Quét mã QR để lấy thông tin người nhận
     - Auto-fill form chuyển tiền
  4. **Nhập thủ công**
     - Nhập số tài khoản và tên người nhận
     - Verify account number với server

### **Transfer Screen** (`transfer_screen.dart`)
- Form chuyển tiền:
  - Chọn tài khoản gửi (dropdown)
  - Số tài khoản người nhận
  - Tên người nhận (hiển thị sau khi verify)
  - Số tiền (với format VND)
  - Nội dung chuyển khoản
  - Phí giao dịch (hiển thị tự động)
  - **Xác thực PIN giao dịch**:
    - Nhập PIN (4-6 số) để xác nhận
    - Yêu cầu thiết lập PIN nếu chưa có
    - Dialog thiết lập PIN nếu cần
  - Xác nhận thông tin (review screen)
  - OTP/2FA verification (nếu cần)
  - Tùy chọn: Lưu người thụ hưởng

### **Transfer Success Screen** (`transfer_success_screen.dart`)
- Hiển thị kết quả chuyển tiền thành công
- Thông tin giao dịch đã tạo
- Tùy chọn: Chia sẻ, Lưu người thụ hưởng

---

## 📱 KYC (Know Your Customer)

### **KYC Capture Screen** (`kyc_capture_screen.dart`)
- Màn hình chính quy trình KYC
- Hướng dẫn từng bước

### **CCCD Scanner Screen** (`cccd_scanner_screen.dart`)
- Quét CCCD/CMND bằng camera
- **OCR tự động** bằng Google ML Kit:
  - Mặt trước: Số CCCD, Họ tên, Ngày sinh, Giới tính, Quốc tịch
  - Mặt sau: Ngày cấp, Nơi cấp
- Cũng hỗ trợ quét Thẻ sinh viên:
  - MSSV (Mã số sinh viên)
  - Họ tên
  - Tên trường

### **Document Capture Screen** (`document_capture_screen.dart`)
- Chụp ảnh tài liệu (CCCD/CMND/Passport)
- Preview và xác nhận ảnh
- Retake nếu cần

### **Selfie Preparation Screen** (`selfie_preparation_screen.dart`)
- Hướng dẫn chụp selfie
- Checklist trước khi chụp

### **Selfie Capture Screen** (`selfie_capture_screen.dart`)
- Chụp ảnh selfie để xác thực
- So sánh với ảnh trên CCCD

### **KYC Storage Info Screen** (`kyc_storage_info_screen.dart`)
- Thông tin về cách lưu trữ dữ liệu KYC
- Bảo mật và quyền riêng tư

### **KYC Success Screen** (`kyc_success_screen.dart`)
- Xác nhận đã gửi KYC thành công
- Thông tin trạng thái (Pending/Approved)

---

## 💳 CARDS MANAGEMENT

### **Cards List Screen** (`cards_list_screen.dart`)
- Danh sách tất cả thẻ:
  - Debit Cards
  - Credit Cards
  - Prepaid Cards
- Thông tin thẻ:
  - Số thẻ (masked): **** **** **** 1234
  - Loại thẻ (VISA, Mastercard)
  - Tên chủ thẻ (uppercase, không dấu)
  - Ngày hết hạn
  - Trạng thái (Active, Blocked)
- Thao tác:
  - **Phát hành thẻ mới** (Issue Card):
    - Chọn tài khoản liên kết
    - Chọn loại thẻ (Debit/Credit)
    - Nhập PIN (4-6 số)
    - Xác nhận phát hành
  - Xem chi tiết thẻ
  - Khóa/Mở khóa thẻ
  - Quản lý hạn mức (daily, monthly, ATM limits)
  - Xem lịch sử giao dịch thẻ

---

## 👤 PROFILE & SETTINGS

### **Profile Screen** (`profile_screen.dart`)

#### Thông tin cá nhân
- Avatar, Họ tên, Email
- Student ID, Cohort, School
- Số điện thoại
- Địa chỉ
- Account Tier (BASIC/STANDARD/PREMIUM/VIP)
- Trạng thái xác thực (Email, Phone, KYC)
- Badge hiển thị tier (STANDARD/PREMIUM/VIP)

#### Cài đặt tài khoản
- **Thông tin cá nhân**:
  - Xem/Chỉnh sửa thông tin cá nhân
  - Đổi số điện thoại (dialog)
  - Đổi email (dialog)
  - Cập nhật địa chỉ

- **Bảo mật**:
  - Đổi mật khẩu (dialog)
  - Xác thực 2FA (bật/tắt với dialog)
  - **Transaction PIN** (PIN giao dịch):
    - Thiết lập PIN giao dịch (4-6 số)
    - Đổi PIN giao dịch
    - Xác thực PIN khi chuyển tiền/phát hành thẻ
  - Quản lý thiết bị đăng nhập (nếu có)
  - Lịch sử đăng nhập

- **Tier & Vanity**:
  - Xem thông tin tier hiện tại
  - Xem yêu cầu để nâng tier (tier requirements)
  - Yêu cầu nâng hạng tier (dialog)
  - Xem lịch sử yêu cầu nâng hạng
  - Chọn số tài khoản đẹp (Vanity Numbers)

- **Thông báo**:
  - Bật/Tắt push notifications (dialog)
  - Email notifications
  - SMS alerts

- **Giao diện**:
  - Dark/Light theme (dialog chọn)
  - Ngôn ngữ (Tiếng Việt/Tiếng Anh - dialog chọn)

- **Khác**:
  - KYC Storage Info (xem thông tin lưu trữ KYC)
  - Liên hệ hỗ trợ
  - Đăng xuất

---

## 📱 QR CODE

### **QR Scanner Screen** (`qr_scanner_screen.dart`)
- Quét mã QR để:
  - Lấy thông tin chuyển tiền (số tài khoản, tên, số tiền)
  - Thanh toán QR
- Tích hợp với camera
- Auto-focus và highlight QR code

### **Account QR Screen** (`account_qr_screen.dart`)
- Hiển thị QR code của tài khoản
- **Thiết kế QR code theo tier** (VIP/PREMIUM/STANDARD):
  - Gradient background theo tier
  - Logo và màu sắc tùy chỉnh
  - Thông tin tài khoản được hiển thị đẹp
- Chia sẻ QR code
- **Lưu QR code vào gallery**:
  - Tự động request permission
  - Lưu với format đẹp (1080x1350px)
  - Tên file có timestamp
- Thông tin tài khoản trong QR:
  - Số tài khoản
  - Tên chủ tài khoản
  - Ngân hàng

---

## 💰 INTEREST (Lãi suất)

### **Interest Screen** (`interest_screen.dart`)
- Thông tin lãi suất:
  - Lãi suất tiết kiệm hiện tại
  - Lãi suất theo kỳ hạn (3, 6, 12, 24 tháng)
  - Lãi suất theo tier (BASIC/STANDARD/PREMIUM/VIP)
- Calculator tính lãi:
  - Nhập số tiền gửi
  - Chọn kỳ hạn
  - Tính lãi suất dự kiến
- Lịch sử lãi suất:
  - Xem các khoản lãi đã nhận
  - Theo dõi tích lũy

### **Interest History Screen** (trong `interest_card.dart`)
- Lịch sử chi tiết lãi suất
- Filter theo tài khoản, thời gian

---

## 🆘 SUPPORT

### **Help Center Screen** (`help_center_screen.dart`)
- FAQ (Câu hỏi thường gặp)
- Hướng dẫn sử dụng
- Liên hệ hỗ trợ
- Feedback/Báo lỗi

---

## 🎨 VANITY NUMBERS

### **Vanity Selection Screen** (`vanity_selection_screen.dart`)
- Chọn số tài khoản đẹp (VIP, PREMIUM, STANDARD)
- **Marketplace**:
  - Xem danh sách số có sẵn (market)
  - Filter theo tier
  - Pagination
- **Availability Check**: Kiểm tra số có sẵn không
- **Price Calculator**: Xem giá số tài khoản
- **Suggestions**: Gợi ý số theo pattern
- **Purchase**: Mua số tài khoản đẹp
  - Chọn account để đổi số
  - Thanh toán
  - Xác nhận mua

---

## 🔔 NOTIFICATIONS & REAL-TIME

- **Push Notifications**: Thông báo real-time về:
  - Giao dịch thành công/thất bại
  - KYC được duyệt/từ chối
  - Cảnh báo bảo mật
  - Lãi suất được cộng
  - Token expiration warnings

- **In-app Notifications**: 
  - Notification center trong app
  - Badge số lượng thông báo chưa đọc

## 🛡️ SECURITY & ERROR HANDLING

### **Transaction PIN (Security PIN)**
- **Set PIN**: Thiết lập PIN giao dịch (4-6 số)
- **Verify PIN**: Xác thực PIN khi thực hiện giao dịch
- **Has PIN Check**: Kiểm tra đã thiết lập PIN chưa
- **PIN Dialog**: Nhập PIN trong dialog khi cần
- **PIN Change**: Đổi PIN giao dịch (trong Profile)
- Sử dụng trong:
  - Chuyển tiền (bắt buộc)
  - Phát hành thẻ (bắt buộc)
  - Các giao dịch quan trọng khác

### **Token Expiration Modal** (`token_expiration_modal.dart`)
- Hiển thị khi token hết hạn
- Yêu cầu đăng nhập lại
- Auto-redirect đến màn hình login
- Animation fade in/scale
- Tránh hiển thị duplicate modal

### **Error Boundary** (`error_boundary.dart`)
- Xử lý lỗi toàn cục trong app
- Hiển thị màn hình lỗi thân thiện
- Tùy chọn quay lại hoặc reload
- Error recovery mechanism

### **Image Storage Service** (`image_storage_service.dart`)
- Lưu trữ KYC images local:
  - Student card images
  - Selfie images
- Quản lý thư mục theo user
- Lấy thông tin storage (số file, dung lượng)
- Xóa images khi cần

---

## 🎯 SUMMARY - TỔNG KẾT CHỨC NĂNG

### Tính năng chính
✅ **Authentication**: Đăng nhập, Đăng ký, 2FA, Reset password
✅ **Dashboard**: Tổng quan tài khoản, số dư, giao dịch gần đây
✅ **Transactions**: Lịch sử, chi tiết, filter, search
✅ **Transfer**: Chuyển tiền với nhiều phương thức (QR, Manual, Saved)
✅ **KYC**: Quét CCCD/CMND, OCR tự động, chụp selfie
✅ **Cards**: Quản lý thẻ Debit/Credit
✅ **Profile**: Thông tin cá nhân, cài đặt, bảo mật
✅ **QR Code**: Quét và tạo QR code tài khoản
✅ **Interest**: Xem lãi suất, tính toán, lịch sử
✅ **Support**: Help center, FAQ
✅ **Vanity Numbers**: Chọn số tài khoản đẹp (marketplace, pricing)
✅ **Transaction PIN**: Bảo mật giao dịch bằng PIN (4-6 số)
✅ **Card Issuance**: Phát hành thẻ mới với PIN

### Tính năng bổ sung
✅ Dark/Light theme
✅ Đa ngôn ngữ (VI/EN)
✅ Pull to refresh
✅ Caching thông minh (5 phút)
✅ Real-time updates qua WebSocket
✅ Offline mode (với cached data)
✅ Token expiration handling
✅ Error boundary & error recovery
✅ Beneficiaries management (quản lý người thụ hưởng)
✅ Tier upgrade requests
✅ Account QR code generation & sharing
✅ Greeting messages theo thời gian
✅ KYC requirement checks (bắt buộc KYC cho một số tính năng)
✅ Local image storage cho KYC (student card, selfie)
✅ QR code design theo tier (VIP/PREMIUM/STANDARD)
✅ Permission handling (photos, camera)

### Services & Utilities
✅ **Security Service**: Transaction PIN management
✅ **Tier Service**: Tier requirements & upgrade requests
✅ **Vanity Service**: Marketplace, availability, pricing
✅ **Image Storage Service**: Local KYC images storage
✅ **QR Save Service**: Save QR to gallery with tier design
✅ **Token Expiration Service**: Handle token expiry
✅ **Notification Service**: Push notifications setup

### Dialogs & Modals
✅ Password change dialog
✅ Email change dialog
✅ Phone change dialog
✅ Transaction PIN setup dialog
✅ Transaction PIN verification dialog
✅ 2FA enable/disable dialog
✅ Notifications settings dialog
✅ Language selection dialog
✅ Theme selection dialog
✅ Tier upgrade dialog
✅ Tier requirements dialog
✅ KYC required dialog
✅ Token expiration modal
✅ Issue card dialog
✅ Error dialogs
✅ Info dialogs

---

**Tổng số màn hình**: 27 screens  
**Tổng số chức năng**: 80+ tính năng  
**Tổng số dialogs/modals**: 16+ dialogs  
**Tổng số services**: 12 services

