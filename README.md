# 🏦 CHIDI BANK - Digital Banking System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Flutter](https://img.shields.io/badge/flutter-3.9.2+-02569B.svg?logo=flutter)

**A comprehensive, production-ready digital banking system with mobile, web admin, and backend API**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Documentation](#-documentation)

</div>

---

## 📖 Overview

**CHIDI BANK** is a modern, enterprise-grade digital banking platform designed to provide a complete financial management solution. The system consists of three main components:

- **Backend API** - RESTful API built with Node.js, Express, and TypeScript
- **Mobile App** - Cross-platform Flutter application for end users
- **Admin Panel** - React-based web administration interface

The platform supports comprehensive banking operations including account management, transactions, e-KYC verification, card management, interest calculations, and real-time notifications.

---

## ✨ Features

### 🔐 Authentication & Security
- **Multi-factor Authentication** - Email/SMS/App-based 2FA
- **JWT Token Management** - Access & Refresh tokens with automatic renewal
- **Role-Based Access Control (RBAC)** - Fine-grained permissions system
- **e-KYC Verification** - OCR-based identity verification using CCCD/CMND/Student ID
- **Session Management** - Secure session handling with device tracking
- **Transaction PIN** - Additional security layer for financial operations

### 💰 Account Management
- **Multiple Account Types** - CHECKING, SAVINGS, BUSINESS accounts
- **Account Tiers** - BASIC, STANDARD, PREMIUM, VIP with different benefits
- **Real-time Balance** - Live balance updates via WebSocket
- **Account Statements** - Transaction history with filters and export
- **Account Limits** - Configurable transaction and daily limits
- **Vanity Account Numbers** - Custom account number selection

### 💳 Transaction System
- **Internal Transfers** - Instant transfers within the bank
- **External Transfers** - Inter-bank transfers
- **QR Code Payments** - Scan and pay functionality
- **Bill Payments** - Utility and service payments
- **Recurring Payments** - Scheduled automatic payments
- **Transaction History** - Comprehensive transaction logs with search

### 🎫 Card Management
- **Virtual Cards** - Debit and Credit card issuance
- **Card Activation** - Secure card activation process
- **PIN Management** - Card PIN setup and reset
- **Spending Limits** - Daily and monthly spending controls
- **Card Controls** - Lock/unlock cards remotely

### 📈 Savings & Interest
- **Savings Accounts** - Flexible and term deposits (3/6/12/24 months)
- **Automatic Interest Calculation** - Daily/monthly interest accrual
- **Compound Interest** - Automated interest compounding
- **Interest Reports** - Detailed interest history

### 📱 Mobile App Features
- **Dark/Light Theme** - Customizable UI themes
- **Biometric Authentication** - Face ID / Fingerprint login
- **Push Notifications** - Real-time transaction alerts
- **QR Scanner** - Built-in QR code scanner
- **Camera Integration** - Document scanning for KYC
- **Offline Support** - Cached data for offline viewing

### 🛠️ Admin Panel
- **User Management** - Complete user CRUD operations
- **KYC Management** - Review and approve KYC submissions
- **Transaction Monitoring** - View and manage all transactions
- **Notification System** - Send announcements to users
- **Dashboard Analytics** - Real-time statistics and reports
- **Role Management** - Configure user roles and permissions

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcrypt, Helmet.js, express-rate-limit
- **Real-time**: WebSocket (ws)
- **Email**: Nodemailer
- **Scheduling**: node-cron
- **Validation**: express-validator

### Mobile App (Flutter)
- **Framework**: Flutter 3.9.2+
- **State Management**: Provider
- **HTTP Client**: http package
- **Local Storage**: shared_preferences
- **QR Scanner**: mobile_scanner
- **Camera**: camera package
- **ML Kit**: google_mlkit_text_recognition, google_mlkit_face_detection
- **Notifications**: flutter_local_notifications
- **WebSocket**: web_socket_channel
- **UI**: Material Design, Google Fonts

### Admin Panel (React)
- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Charts**: Recharts

---

## 📁 Project Structure

```
Banking-System/
├── backend/                 # Backend API Server
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── prisma/             # Prisma schema and migrations
│   └── scripts/            # Utility scripts
│
├── banking_flutter/         # Flutter Mobile App
│   └── lib/
│       ├── src/
│       │   ├── config/     # App configuration
│       │   ├── models/     # Data models
│       │   ├── routes/     # Navigation routes
│       │   ├── screens/    # UI screens
│       │   ├── services/   # API services
│       │   ├── theme/      # Theme configuration
│       │   └── widgets/    # Reusable widgets
│       └── main.dart       # App entry point
│
├── banking_admin/           # React Admin Panel
│   └── src/
│       ├── components/     # React components
│       ├── pages/          # Page components
│       ├── services/       # API services
│       └── types/          # TypeScript types
│
└── docs/                    # Documentation
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** >= 14.0
- **Flutter SDK** >= 3.9.2
- **Git**

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/developerchidi/CHIDI_BANK.git
   cd CHIDI_BANK/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/banking_system"
   JWT_SECRET="your-secret-key"
   JWT_REFRESH_SECRET="your-refresh-secret-key"
   PORT=3001
   
   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_MAIL=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ```

4. **Setup database**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run setup
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   Server will run on `http://localhost:3001`

### Mobile App Setup

1. **Navigate to Flutter app**
   ```bash
   cd banking_flutter
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Configure API endpoint**
   
   Edit `lib/src/config/api_config.dart`:
   ```dart
   static const String baseUrl = 'http://YOUR_IP:3001';
   ```

4. **Run the app**
   ```bash
   flutter run
   ```

### Admin Panel Setup

1. **Navigate to admin panel**
   ```bash
   cd banking_admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API endpoint**
   
   Edit `src/services/api.ts` with your backend URL

4. **Start development server**
   ```bash
   npm run dev
   ```

   Admin panel will run on `http://localhost:5173`

---

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/banking_system"

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_MAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# WebSocket
WS_PORT=3001
```

### API Configuration

Update the base URL in:
- **Flutter**: `banking_flutter/lib/src/config/api_config.dart`
- **Admin Panel**: `banking_admin/src/services/api.ts`

---

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api/v1
```

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with code
- `POST /auth/2fa/enable` - Enable 2FA
- `POST /auth/2fa/verify` - Verify 2FA code
- `POST /auth/2fa/complete-login` - Complete login with 2FA

### Account Endpoints
- `GET /accounts` - Get user accounts
- `POST /accounts` - Create new account
- `GET /accounts/:id` - Get account details
- `GET /accounts/:id/transactions` - Get account transactions
- `PUT /accounts/:id/freeze` - Freeze account
- `PUT /accounts/:id/unfreeze` - Unfreeze account

### Transaction Endpoints
- `POST /transactions/internal` - Internal transfer
- `POST /transactions/external` - External transfer
- `GET /transactions` - Get transaction history
- `GET /transactions/:id` - Get transaction details
- `POST /transactions/verify-otp` - Verify transaction OTP

### KYC Endpoints
- `POST /kyc/submit` - Submit KYC documents
- `GET /kyc/status` - Get KYC status
- `GET /kyc/documents` - Get KYC documents (Admin)

### Notification Endpoints
- `GET /notifications` - Get user notifications
- `GET /notifications/:id` - Get notification details
- `PUT /notifications/:id/read` - Mark as read
- `PUT /notifications/read-all` - Mark all as read
- `GET /notifications/unread-count` - Get unread count

For complete API documentation, see [API Documentation](./backend/docs/API_DOCUMENTATION.md)

---

## 🔒 Security Features

- **Password Hashing**: bcrypt with configurable rounds
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: express-validator for request validation
- **Helmet.js**: Security headers
- **CORS**: Configurable cross-origin resource sharing
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Protection**: Input sanitization
- **CSRF Protection**: Token-based CSRF protection

---

## 🧪 Testing

### Backend
```bash
cd backend
npm test
```

### Flutter
```bash
cd banking_flutter
flutter test
```

---

## 📱 Screenshots

*Add screenshots of your application here*

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- **Backend**: Follow TypeScript/Node.js best practices
- **Flutter**: Follow Dart style guide
- **React**: Follow React best practices and use TypeScript

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Developer Chidi** - [@developerchidi](https://github.com/developerchidi)

---

## 🙏 Acknowledgments

- Flutter team for the amazing framework
- Express.js community
- All contributors and users of this project

---

## 📞 Support

For support, email support@chidibank.com or create an issue in this repository.

---

## 🔮 Roadmap

- [ ] Multi-currency support
- [ ] International transfers
- [ ] Investment products
- [ ] Loan management
- [ ] Mobile app iOS release
- [ ] Advanced analytics dashboard
- [ ] API rate limiting dashboard
- [ ] Webhook support

---

<div align="center">

**Made with ❤️ by CHIDI BANK Team**

⭐ Star this repo if you find it helpful!

</div>

