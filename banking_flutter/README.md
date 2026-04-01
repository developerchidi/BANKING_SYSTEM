# Chidi Bank Mobile (Flutter)

## Cổng API và Backend Java

Mặc định app trỏ tới **`http://127.0.0.1:3001`** — trùng với `server.port` trong `banking_core_java` (`application.yml`).

Đổi host/port khi build:

```bash
flutter run --dart-define=API_HOST=192.168.1.10 --dart-define=API_PORT=3001
```

URL đầy đủ (staging/prod HTTPS) và flavor:

```bash
flutter run --dart-define=API_BASE_URL=https://api.example.com --dart-define=FLAVOR=staging
```

Access/refresh token được lưu bằng `flutter_secure_storage` (fallback migrate từ SharedPreferences).

## Kiểm thử

```bash
flutter test
flutter analyze
```

## Cấu trúc

- `lib/src/config/api_config.dart` — base URL và endpoint prefix.
