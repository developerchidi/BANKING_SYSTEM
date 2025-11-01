-- Script để xóa hoặc cập nhật email admin không hợp lệ
-- Chạy script này trong PostgreSQL

-- Xem các admin có email không hợp lệ
SELECT u.id, u.email, u."firstName", u."lastName", r.name as role_name
FROM users u
JOIN "UserRole" ur ON u.id = ur."userId"
JOIN "Role" r ON ur."roleId" = r.id
WHERE r.name IN ('ADMIN', 'SUPER_ADMIN')
AND (u.email = 'admin@bank.com' OR u.email NOT LIKE '%@%.%' OR u.email IS NULL);

-- Cập nhật email admin không hợp lệ (thay bằng email thật)
-- UPDATE users 
-- SET email = 'your-admin-email@gmail.com'
-- WHERE email = 'admin@bank.com';

-- HOẶC xóa user admin không hợp lệ (cẩn thận!)
-- DELETE FROM users WHERE email = 'admin@bank.com';

