# Script PowerShell để kiểm tra email admin trong database
# Yêu cầu: Cần có psql hoặc Prisma Studio

Write-Host "🔍 Checking admin emails in database..." -ForegroundColor Cyan

# Nếu dùng Prisma Studio, mở trong browser
Write-Host ""
Write-Host "Option 1: Use Prisma Studio" -ForegroundColor Yellow
Write-Host "  Run: npx prisma studio" -ForegroundColor Gray
Write-Host "  Then navigate to Users table and check emails with ADMIN/SUPER_ADMIN roles"
Write-Host ""

# Nếu dùng psql trực tiếp
Write-Host "Option 2: Use psql directly" -ForegroundColor Yellow
Write-Host "  Run this SQL query:" -ForegroundColor Gray
Write-Host ""
Write-Host "  SELECT u.id, u.email, u.""firstName"", u.""lastName"", r.name as role_name" -ForegroundColor Green
Write-Host "  FROM users u" -ForegroundColor Green
Write-Host "  JOIN ""UserRole"" ur ON u.id = ur.""userId""" -ForegroundColor Green
Write-Host "  JOIN ""Role"" r ON ur.""roleId"" = r.id" -ForegroundColor Green
Write-Host "  WHERE r.name IN ('ADMIN', 'SUPER_ADMIN');" -ForegroundColor Green
Write-Host ""

# Hoặc dùng Prisma query qua Node.js
Write-Host "Option 3: Use Prisma query script" -ForegroundColor Yellow
Write-Host "  Create a file 'check-admin.js' and run: node check-admin.js" -ForegroundColor Gray

# Kiểm tra file .env có config database không
Write-Host ""
Write-Host "Checking DATABASE_URL in .env..." -ForegroundColor Cyan
if (Test-Path ".env") {
    $envContent = Get-Content .env
    $dbUrl = $envContent | Select-String "DATABASE_URL"
    if ($dbUrl) {
        Write-Host "✅ DATABASE_URL found" -ForegroundColor Green
        Write-Host $dbUrl -ForegroundColor Gray
    } else {
        Write-Host "❌ DATABASE_URL not found in .env" -ForegroundColor Red
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "📧 Admin emails that might cause issues:" -ForegroundColor Yellow
Write-Host "  - admin@bank.com (doesn't exist)" -ForegroundColor Red
Write-Host "  - Any email without @ symbol" -ForegroundColor Red
Write-Host "  - NULL emails" -ForegroundColor Red
Write-Host ""
Write-Host "💡 Solution: Update or delete invalid admin emails in database" -ForegroundColor Cyan

