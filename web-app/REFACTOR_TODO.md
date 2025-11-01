# 🛠️ WEB-APP REFACTOR TODO LIST

## 1. State Management
- [x] Thiết lập state management toàn cục (Redux, Zustand hoặc Context API)
- [x] Tách state user, auth, notification, global UI state ra khỏi component

## 2. Component Structure
- [x] Gom các Modal (InternalTransferModal, ExternalTransferModal, BeneficiaryTransferModal) vào thư mục `components/ui/`
- [x] Tách rõ container component và presentational component
- [x] Chia nhỏ các component lớn thành component nhỏ, dễ test, dễ tái sử dụng
- [x] Gom các component UI cơ bản vào thư mục `components/ui/`

## 3. Naming & Convention
- [x] Đảm bảo tất cả component đặt tên theo PascalCase
- [x] Đặt tên file hook theo dạng `useXxx.ts`
- [x] Đặt tên page theo dạng PascalCase, kết thúc bằng `Page.tsx`
- [x] Thêm `index.ts` cho các thư mục lớn (components, hooks, pages...)

## 4. Performance Optimization
- [x] Sử dụng React.memo cho component nhận nhiều props
- [x] Áp dụng useCallback, useMemo cho các hàm/giá trị truyền xuống nhiều component con
- [x] Tạo custom hooks: useApi, useLocalStorage, useDebounce, useClickOutside
- [x] Tạo ErrorBoundary component để xử lý lỗi
- [x] Tạo Loading component với các variants khác nhau

## 5. Custom Hooks
- [x] Tách logic fetch API, loading, error ra custom hook (useApi)
- [x] Viết custom hook cho các logic lặp lại (useLocalStorage, useDebounce, useClickOutside)

## 6. UI Library
- [x] Tạo Button component tái sử dụng trong `components/ui/`
- [x] Refactor các button ở page Cards sang Button component tái sử dụng
- [x] Refactor các button ở TransactionList sang Button component tái sử dụng
- [x] Refactor các button ở TransferForm sang Button component tái sử dụng
- [x] Refactor các button ở AccountList sang Button component tái sử dụng
- [x] Refactor các button ở DashboardLayout sang Button component tái sử dụng
- [x] Refactor các button ở TransferFormEnhanced sang Button component tái sử dụng
- [x] Refactor các button ở LoginForm và RegisterForm sang Button component tái sử dụng
- [x] Refactor các button ở ForgotPasswordForm và ChangePasswordForm sang Button component tái sử dụng
- [x] Refactor các button ở ResetPasswordForm và TwoFactorForm sang Button component tái sử dụng
- [x] Refactor các input ở LoginForm và RegisterForm sang Input component tái sử dụng
- [x] Refactor các input ở ChangePasswordForm, ForgotPasswordForm, ResetPasswordForm sang Input component tái sử dụng
- [x] Refactor các input ở TransferForm và TransferFormEnhanced sang Input component tái sử dụng
- [x] Refactor các input ở AccountList sang Input component tái sử dụng
- [x] Refactor các card UI ở Dashboard và AccountList sang Card component tái sử dụng
- [x] Refactor các card UI ở Cards và TransactionList sang Card component tái sử dụng
- [x] Refactor các modal/dialog nhỏ sang Modal component tái sử dụng
- [x] Đảm bảo style, theme, spacing, typography nhất quán

## 7. Testing
- [x] Thêm unit test cho các component chính (Jest, React Testing Library)
- [x] Thêm test cho custom hook

## 8. Routing & Code Splitting
- [x] Áp dụng code splitting (React.lazy, Suspense) cho các page lớn

## 9. Error Handling
- [x] Thêm ErrorBoundary cho toàn app
- [x] Xử lý error UI cho các page chính

---

*File này dùng để theo dõi các hạng mục refactor chuẩn hóa ReactJS cho web-app.* 