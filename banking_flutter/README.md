# banking_flutter

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.
# Banking Flutter App

A Flutter port of the mobile app UI, referencing mobile-app/ flows (Auth with optional 2FA, basic Dashboard).

## Prerequisites
- Flutter SDK (stable)
- Enable Windows Developer Mode (required by shared_preferences plugin):
  - Run: start ms-settings:developers
  - Turn on Developer Mode

## Configure API
Edit lib/src/config/api_config.dart:
`
static const String baseUrl = 'http://YOUR_IP:3001';
`
You can mirror IPs from mobile-app/src/config/environments.ts.

## Install dependencies
`
flutter pub get
`

## Run
`
flutter run -d windows   # or chrome / android / ios
`

## Auth Flow
1. Login with email/password
2. If server returns equiresTwoFactor=true, navigate to 2FA screen
3. Enter 6-digit code  complete login, navigate to Dashboard

## Notes
- Tokens are stored with shared_preferences under keys: ccessToken, efreshToken, user.
- Endpoints mirror mobile-app:
  - POST /api/auth/login
  - POST /api/auth/2fa/complete-login
- Extend with accounts/transactions screens by following the same pattern.
