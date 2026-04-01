# Chidi Bank -- Digital Banking System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Java](https://img.shields.io/badge/Java-21-ED8B00.svg?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4-6DB33F.svg?logo=spring-boot)
![Flutter](https://img.shields.io/badge/Flutter-3.9+-02569B.svg?logo=flutter)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1.svg?logo=postgresql&logoColor=white)

**A full-stack digital banking platform with a Spring Boot backend and Flutter mobile client.**

[Features](#features) | [Architecture](#architecture) | [Getting Started](#getting-started) | [API Reference](#api-reference) | [Testing](#testing) | [Documentation](#documentation)

</div>

---

## Overview

Chidi Bank is a modern banking platform comprising two main modules:

| Module | Technology | Description |
|--------|-----------|-------------|
| **banking_core_java** | Spring Boot 3.4 / Java 21 | RESTful API server: authentication, accounts, transactions, cards, notifications, interest, KYC, admin. |
| **banking_flutter** | Flutter / Dart | Cross-platform mobile client: login, dashboard, transfers, card management, e-KYC, real-time notifications. |

The system uses PostgreSQL for persistence and Redis for OTP storage, token blacklisting, and rate limiting.

---

## Features

### Authentication and Security

- JWT access and refresh tokens with session-bound rotation.
- Logout with access-token blacklisting (DB-backed).
- Two-factor authentication (email or app-based).
- Redis rate limiting on login, register, and transfer endpoints.
- KYC gate: sensitive operations (transfer, card issuance) require verified KYC status.
- Request correlation via `X-Request-Id` header propagated through MDC.
- Secure token storage on mobile (`flutter_secure_storage`).

### Account Management

- Multiple account types (Checking, Savings, Business).
- Tier system (Basic, Standard, Premium, VIP) with automatic upgrades.
- Configurable daily and monthly transaction limits, enforced server-side.
- Real-time balance via WebSocket.

### Transactions

- Internal transfers with OTP verification, idempotency key, and atomic balance updates.
- Daily/monthly limit enforcement computed from completed outgoing volume.
- Transaction history with pagination and filtering.
- Audit trail for every sensitive operation (PII-safe).

### Card Management

- Virtual card issuance (Visa).
- PIN hashing (bcrypt); CVV never returned by API.
- Card number masked in all API responses (`**** **** **** 1234`).
- Lock, unlock, activate, and limit configuration.

### Savings and Interest

- Scheduled interest calculation with idempotent execution.
- Tier-based interest rate multiplier.
- Compound interest support.

### Notifications

- Server-sent WebSocket notifications for transactions, deposits, interest, and system events.
- Push notifications on mobile via `flutter_local_notifications`.
- Mark-as-read, unread count, and history endpoints.

### Observability

- Structured console logging with correlation ID (`%X{requestId}`).
- Spring Boot Actuator with health probes (DB + Redis readiness).
- Audit log entity for compliance-sensitive actions.

---

## Architecture

```text
Banking-System/
|-- banking_core_java/          Spring Boot backend
|   |-- src/main/java/.../
|   |   |-- adapter/in/web/     REST controllers (Auth, Banking, Card, Admin, User, Notification)
|   |   |-- adapter/out/        JPA repositories, Redis adapters
|   |   |-- application/
|   |   |   |-- port/in/        Use-case interfaces
|   |   |   |-- port/out/       Persistence port interfaces
|   |   |   |-- service/        Business logic (AuthService, BankingService, CardService, ...)
|   |   |   +-- exception/      Domain exceptions
|   |   |-- domain/             Entity POJOs and enums
|   |   +-- infrastructure/     Security filters, Redis/JPA config, JWT provider
|   +-- src/test/java/          Unit tests (Mockito)
|
|-- banking_flutter/            Flutter mobile app
|   +-- lib/
|       |-- src/
|       |   |-- config/         ApiConfig (host, port, base URL, flavor)
|       |   |-- models/         Dart data models
|       |   |-- providers/      ChangeNotifier state (AuthProvider, ThemeProvider)
|       |   |-- screens/        UI screens (login, dashboard, transfer, KYC, cards, ...)
|       |   |-- services/       API client, AuthService, TokenStorage, NotificationService
|       |   +-- theme/          Light/dark theme definitions
|       +-- main.dart
|
|-- docs/                       QA reports, smoke checklist, feature lists
+-- .github/workflows/          CI: Gradle test + Flutter test
```

The backend follows a **hexagonal (ports-and-adapters)** design. Controllers call use-case ports; services implement business rules; persistence adapters fulfill outbound ports via Spring Data JPA and Redis.

---

## Getting Started

### Prerequisites

| Dependency | Minimum Version |
|------------|----------------|
| Java (JDK) | 21 |
| Gradle | 9.x (wrapper included) |
| PostgreSQL | 14 |
| Redis | 6 |
| Flutter SDK | 3.9.2 |
| Dart | 3.x (bundled with Flutter) |

### 1. Clone the repository

```bash
git clone https://github.com/developerchidi/BANKING_SYSTEM.git
cd BANKING_SYSTEM
```

### 2. Backend setup

```bash
cd banking_core_java
```

Create a `.env` file (or export environment variables) with the following keys:

```env
# Database
DATABASE_URL=localhost:5432/banking_system
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_MAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Server
PORT=3001
```

Run the backend:

```bash
./gradlew bootRun
```

Verify health:

```bash
curl http://localhost:3001/actuator/health
```

### 3. Flutter setup

```bash
cd banking_flutter
flutter pub get
```

By default the app connects to `http://127.0.0.1:3001`. Override at build time if needed:

```bash
# Custom host/port
flutter run --dart-define=API_HOST=192.168.1.10 --dart-define=API_PORT=3001

# Full URL for staging/production
flutter run --dart-define=API_BASE_URL=https://api.example.com --dart-define=FLAVOR=staging
```

---

## API Reference

Base paths: `/api/auth`, `/api/banking`, `/api/cards`, `/api/user`, `/api/notifications`, `/api/admin`.
Legacy prefix `/api/v1/...` is also supported for backward compatibility.

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login (returns access + refresh tokens) |
| POST | `/api/auth/refresh` | Rotate tokens (session-bound) |
| POST | `/api/auth/logout` | Blacklist access token, deactivate session |
| POST | `/api/auth/forgot-password` | Request password reset email |
| POST | `/api/auth/reset-password` | Reset password with token |
| POST | `/api/auth/2fa/enable` | Enable two-factor authentication |
| POST | `/api/auth/2fa/complete-login` | Complete login with 2FA code |
| GET  | `/api/auth/me` | Get current user profile |

### Banking

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/banking/accounts` | List user accounts |
| POST | `/api/banking/accounts` | Create account |
| GET | `/api/banking/accounts/:id` | Account details |
| POST | `/api/banking/transfer` | Initiate transfer (returns OTP) |
| POST | `/api/banking/transfer/verify` | Verify transfer OTP |
| POST | `/api/banking/transfer/resend-otp` | Resend transfer OTP |
| GET | `/api/banking/transactions` | Transaction history (paginated) |
| GET | `/api/banking/dashboard/summary` | Dashboard summary |
| POST | `/api/banking/verify-account` | Verify destination account |

### Cards

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cards` | List user cards (PAN masked) |
| POST | `/api/cards` | Create virtual card (KYC required) |
| PUT | `/api/cards/:id/status` | Activate / block card |
| PUT | `/api/cards/:id/pin` | Change card PIN |
| PUT | `/api/cards/:id/limits` | Update spending limits |

### Notifications

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notifications` | List notifications (paginated) |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all as read |
| GET | `/api/notifications/unread-count` | Unread count |

All authenticated endpoints require the `Authorization: Bearer <token>` header.

---

## Testing

### Backend (Java)

```bash
cd banking_core_java
./gradlew test
```

Current test suites:

- `BankingCoreJavaApplicationTests` -- application context smoke test.
- `AdminServiceTest` -- aggregated system stats.
- `BankingServiceTransferRulesTest` -- KYC gate and daily limit enforcement.
- `CustomUserDetailsServiceTest` -- user details and authority mapping.

### Flutter

```bash
cd banking_flutter
flutter test
```

- `widget_test.dart` -- minimal smoke test (`MaterialApp` renders).

### CI

GitHub Actions workflow (`.github/workflows/ci-java-flutter.yml`) runs both `gradlew test` and `flutter test` on push.

---

## Configuration Reference

### Backend (`application.yml`)

| Property | Default | Description |
|----------|---------|-------------|
| `server.port` | `3001` | HTTP listen port |
| `spring.data.redis.*` | `localhost:6379` | Redis connection |
| `app.rate-limit.login-per-minute` | `60` | Max login attempts per IP per minute |
| `app.rate-limit.transfer-per-minute` | `40` | Max transfer attempts per IP per minute |
| `app.cors.allowed-origins` | `localhost:5173,localhost:3000` | CORS allowed origins |
| `jwt.secret` / `jwt.refresh-secret` | (required) | JWT signing secrets |
| `jwt.expiration` / `jwt.refresh-expiration` | (required) | Token TTL (e.g. `15m`, `7d`) |

### Flutter (`ApiConfig`)

| `--dart-define` | Default | Description |
|-----------------|---------|-------------|
| `API_HOST` | `127.0.0.1` | Backend host |
| `API_PORT` | `3001` | Backend port |
| `API_BASE_URL` | (none) | Full URL override (takes precedence) |
| `FLAVOR` | `dev` | Build flavor label |

---

## Security Considerations

- **Tokens**: Access tokens are short-lived; refresh tokens are rotated on each use and bound to a `LoginSession` record. Logout blacklists the access token until expiry.
- **Passwords**: Hashed with bcrypt (12 rounds). Card PINs are also bcrypt-hashed.
- **Rate limiting**: Redis-backed per-IP counters on authentication and transfer endpoints.
- **Sensitive data**: Card PAN is masked in all API responses. CVV is never returned. Audit logs redact PII to the last 4 digits where applicable.
- **Client storage**: Flutter stores tokens in OS-level secure storage (`flutter_secure_storage`), not `SharedPreferences`.
- **Production**: Use environment variables or a secret manager for all credentials. The dotenv loader is skipped when `SPRING_PROFILES_ACTIVE` contains `prod`. Enable TLS via a reverse proxy or `server.ssl` configuration.

---

## Documentation

| Document | Path |
|----------|------|
| QA Test Report | `docs/QA_TEST_REPORT.md` |
| Smoke E2E Checklist | `docs/SMOKE_E2E_CHECKLIST.md` |
| Feature List (Flutter) | `docs/DANH_SACH_CHUC_NANG_FLUTTER.md` |
| Product Overview | `docs/GIOI_THIEU_TONG_QUAN.md` |
| Migration Parity Matrix | `banking_core_java/src/main/resources/migration-parity-matrix.md` |
| Release Checklist | `banking_core_java/src/main/resources/release-checklist.md` |

---

## Contributing

1. Fork the repository.
2. Create a feature branch from `develop`: `git checkout -b feature/your-feature`.
3. Write tests alongside your code.
4. Run `./gradlew test` and `flutter test` before committing.
5. Open a pull request against `develop` with a clear description.

### Code style

- **Java**: 2-space indentation, Lombok for boilerplate, meaningful variable names.
- **Dart/Flutter**: 2-space indentation, `flutter analyze` clean, prefer `const` constructors.
- **Commits**: conventional format (`feat:`, `fix:`, `docs:`, `refactor:`).

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
