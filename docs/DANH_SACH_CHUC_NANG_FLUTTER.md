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

## 🏠 DASHBOARD (Màn hình chính)

- **Tổng quan số dư**: Hiển thị số dư tài khoản và ẩn/hiện số dư nhanh
- **Tài khoản của tôi**: Danh sách tài khoản (số TK, tên, số dư), tap để xem chi tiết
- **Giao dịch gần đây**: 5-10 giao dịch mới nhất, tap để xem chi tiết giao dịch
- **Hành động nhanh**: Chuyển tiền, Lịch sử, Thẻ, Lãi suất
- **Chuông thông báo**: Badge số chưa đọc, cập nhật real-time, mở danh sách thông báo
- **Trạng thái KYC**: Banner nhắc hoàn tất KYC (nếu chưa), dẫn tới quy trình KYC

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
- Xem lịch sử giao dịch với search và filter theo loại (Tất cả, Chuyển khoản, Nạp tiền, Rút tiền, Thanh toán), nhóm theo ngày (Hôm nay, Hôm qua, ...), hiển thị thông tin: icon theo loại, mô tả, ngày giờ, badge trạng thái, số tiền (màu xanh/đỏ), transaction ID, tap để xem chi tiết giao dịch

### **Transaction Detail Screen** (`transaction_detail_screen.dart`)
- Xem chi tiết giao dịch: số giao dịch, ngày giờ, số tiền và phí, tài khoản gửi/nhận, mô tả/nội dung, trạng thái và thời gian xử lý, reference number

---

## 💰 TRANSFER (Chuyển tiền)

- **Transfer Type Screen**: Chọn phương thức chuyển tiền (người thụ hưởng đã lưu, giao dịch gần đây, quét QR code, nhập thủ công)
- **Transfer Screen**: Form chuyển tiền với các trường (tài khoản nguồn, số tài khoản người nhận - tự động verify khi focus ra, số tiền, nội dung giao dịch tự động điền format "<TÊN USER KHÔNG DẤU IN HOA> chuyen khoan"), xác thực bằng Transaction PIN, yêu cầu OTP/2FA nếu cần
- **Transfer Success Screen**: Hiển thị kết quả thành công và thông tin giao dịch

---

## 📱 KYC (Know Your Customer) - Xác minh danh tính

- **KYC Capture Screen**: Quy trình xác thực KYC theo từng bước
- **CCCD Scanner**: Quét CCCD/CMND bằng camera, **OCR tự động** (Google ML Kit) trích xuất thông tin mặt trước/sau, hỗ trợ quét Thẻ sinh viên
- **Document Capture**: Chụp và xác nhận ảnh tài liệu (CCCD/CMND/Passport)
- **Selfie Capture**: Chụp selfie với **Face Detection** (phát hiện khuôn mặt), gửi lên server để admin so sánh thủ công với ảnh trên CCCD
- **KYC Success**: Xác nhận đã gửi KYC thành công, hiển thị trạng thái (Pending/Approved/Rejected)
- Admin duyệt KYC → tự động gửi thông báo real-time cho user

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

#### Tier
- Xem tier hiện tại (BASIC/STANDARD/PREMIUM/VIP) và quyền lợi
- Xem yêu cầu để nâng hạng (tier requirements)
- Gửi yêu cầu nâng hạng (dialog) và theo dõi trạng thái
- Xem lịch sử yêu cầu nâng hạng

#### Vanity Numbers (Số tài khoản đẹp)
- Duyệt danh sách số tài khoản đẹp theo hạng mục/giá
- Tìm kiếm, lọc theo độ đẹp/giá
- Đặt mua/chọn số (kèm xác nhận)
- Hiển thị số đã sở hữu

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
- **Quét QR chuyển khoản**: Quét mã QR bằng camera để lấy thông tin người nhận (số tài khoản, tên), hỗ trợ nhiều format (Custom JSON, VietQR, EMV QR, Plain Account Number), tự động fetch tên tài khoản từ API nếu thiếu, sau đó chuyển sang màn hình chuyển tiền với thông tin đã điền sẵn
- Tích hợp với camera, auto-focus, highlight QR code, có nút bật/tắt đèn flash

### **Account QR Screen** (`account_qr_screen.dart`)
- Hiển thị QR code của tài khoản, **thiết kế theo tier** (VIP/PREMIUM/STANDARD) với gradient background và màu sắc tùy chỉnh
- **Tạo QR thanh toán**: kèm số tiền và nội dung (memo) để người khác quét và điền sẵn
- Chia sẻ QR code và **lưu vào gallery** (tự động request permission, format 1080x1350px)

---

## 💰 LÃI SUẤT TIẾT KIỆM

- **Màn hình lãi suất** (`interest_screen.dart`): Hiển thị lãi suất theo loại tài khoản (SAVINGS/CHECKING) và tier (STANDARD/PREMIUM/VIP), máy tính tính lãi dự kiến, lịch sử lãi suất đã nhận
- **Tính lãi tự động**: Hệ thống tự động tính và cộng lãi suất hàng tháng (cron job), tính theo số dư và số ngày trong kỳ
- **Thông báo lãi suất**: Gửi thông báo real-time khi lãi suất được cộng vào tài khoản (qua WebSocket và notification record), hiển thị trong Notification List và Transaction History
- **Lịch sử lãi suất**: Xem chi tiết các kỳ tính lãi, tổng lãi suất trong năm, giao dịch INTEREST_CREDIT trong transaction history

---

## 💳 THẺ

- **Quản lý thẻ**: Danh sách thẻ Debit/Credit, xem chi tiết thẻ (số thẻ rút gọn, trạng thái, hạn mức, ngày hết hạn)
- **Phát hành thẻ ảo**: Tạo thẻ ảo dùng online, nhận PIN khi phát hành
- **Khóa/Mở khóa thẻ**: Toggle trạng thái thẻ (block/unblock) tức thì
- **Hạn mức theo tier**: Cập nhật hạn mức chi tiêu/rút tiền theo tier (STANDARD/PREMIUM/VIP)
- **PIN thẻ**: Thiết lập/đổi PIN thẻ an toàn
- **Lịch sử giao dịch theo thẻ**: Lọc giao dịch liên quan đến thẻ
- **Thông báo**: Gửi thông báo khi khóa/mở thẻ, thay đổi hạn mức, phát hành thẻ

---

## 🆘 SUPPORT

### **Trung tâm trợ giúp (Help Center)** (`help_center_screen.dart`)
- **Danh mục trợ giúp**: Câu hỏi thường gặp (FAQ), Hướng dẫn sử dụng, Chính sách
- **Tìm kiếm nhanh**: Gợi ý theo từ khóa, lọc theo danh mục
- **Liên hệ hỗ trợ**: Gọi hotline, gửi email, chat hỗ trợ (nếu bật)
- **Báo lỗi/Phản hồi**: Gửi phản hồi kèm ảnh/chụp màn hình
- **Trạng thái hệ thống**: Thông báo sự cố, bảo trì (nếu có)

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

## 🔔 THÔNG BÁO & REAL-TIME

- **Chuông thông báo (Dashboard)**: Icon chuông ở thanh trên với badge đỏ hiển thị số thông báo chưa đọc (tối đa "99+"), cập nhật real-time qua WebSocket, nhấn để mở danh sách thông báo
- **Màn hình danh sách thông báo** (`notification_list_screen.dart`): Danh sách thông báo với phân trang, lọc theo loại (Hệ thống, KYC, Giao dịch, Thông báo, Bảo mật), đánh dấu đã đọc/chưa đọc, nhấn để xem chi tiết
- **Màn hình chi tiết thông báo** (`notification_detail_screen.dart`): Xem chi tiết thông báo (tiêu đề, nội dung, thời gian, loại, trạng thái), liên kết đến đối tượng liên quan nếu có
- **Thông báo đẩy**: Thông báo real-time về giao dịch, KYC, cảnh báo bảo mật, lãi suất, cảnh báo hết hạn token, nạp tiền từ admin

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
✅ **Notifications**: Notification bell với badge counter, danh sách thông báo real-time, filter và chi tiết
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

**Tổng số màn hình**: 27 screens (bao gồm Notification List & Detail)  
**Tổng số chức năng**: 80+ tính năng  
**Tổng số dialogs/modals**: 16+ dialogs  
**Tổng số services**: 12 services

