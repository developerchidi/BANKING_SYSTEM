# Java Core Release Checklist

## Pre-release
- Apply DB migration scripts on staging and verify schema compatibility.
- Set `SPRING_PROFILES_ACTIVE=prod`.
- Set `JPA_DDL_AUTO=validate` and `JPA_SHOW_SQL=false`.
- Configure `CORS_ALLOWED_ORIGINS` for admin/web domains only.
- Configure JWT/DB/Redis/SMTP secrets via environment variables.

## Security
- Verify `ADMIN` endpoints require role authorities.
- Verify no sensitive logs for OTP/reset tokens.
- Verify refresh/access token flows and logout behavior.

## Transaction Safety
- Run concurrent transfer smoke test (same source account).
- Verify idempotency key duplicate requests do not create duplicated transfers.
- Verify OTP retry limits and resend policy.

## Client Smoke Tests
- Flutter: login, dashboard, transfer with OTP, cards.
- Admin web: stats, users list, KYC approve/reject.
- Notifications: unread count, mark read flow.

## Rollback
- Keep previous jar and environment snapshot.
- Roll back app deployment first, then DB migration only if backward compatible.
