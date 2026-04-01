# Backend Parity Matrix (Node -> Java)

## Scope
- Source of truth: `backend` API contract.
- Target: `banking_core_java` must preserve request/response/auth behavior.

## Endpoint Parity

| Domain | Legacy Node | Java Core | Status |
|---|---|---|---|
| Auth login/register/refresh/logout | Available | Available | Done |
| Forgot/reset/change password | Available | Available | Done |
| Check email/phone/studentId | Available | Available | Done |
| Accounts list/detail/create/update limits | Available | Available | Done |
| Transfer + verify OTP + resend OTP | Available | Available | Done (resend implemented) |
| Transactions list/by account | Available | Available | Done |
| Verify account + dashboard summary | Available | Available | Done |
| Beneficiaries list | Available | Available | Done |
| Cards list/create/status/pin/limits | Available | Available | Done |
| Notifications CRUD + unread count | Available | Available | Partial (create endpoint still map payload) |
| Admin stats/users/kyc review | Available | Available | Done (mock removed) |
| KYC submit/deactivate placeholders | TODO in legacy too | Placeholder response | Partial |
| Interest/Tier admin-heavy flows | Available | Partial | Gap |
| Realtime websocket notifications | Available | Not in Java core | Gap |

## Data Parity

| Legacy Prisma Model | Java Entity | Status |
|---|---|---|
| User/UserProfile | UserEntity/UserProfileEntity | Done |
| Account | AccountEntity | Done |
| Transaction | TransactionEntity | Done |
| Card | CardEntity | Done |
| Beneficiary | BeneficiaryEntity | Done |
| Notification | NotificationEntity | Done |
| Interest/InterestRate | InterestEntity/InterestRateEntity | Partial |
| UserRole/Role | UserRoleEntity/RoleEntity | Done |
| PasswordReset/LoginSession | PasswordResetEntity/LoginSessionEntity | Done |

## Critical Gaps Resolved in This Migration Iteration
- Replaced `Map` payloads for critical auth/banking/card/admin write endpoints with validated DTOs.
- Added method security support and authority mapping from user roles.
- Added standardized business exception hierarchy and safer global error responses.
- Added transfer idempotency key handling.
- Added pessimistic locking methods for account reads in transfer execution.
- Implemented resend OTP behavior instead of placeholder success response.
- Removed wildcard CORS in critical controllers in favor of central config.
- Removed sensitive reset-code console log.

## Remaining High-Priority Gaps
- Notification creation endpoint still uses loose payload map.
- KYC submission/deactivate endpoints still compatibility responses, not full workflow.
- Websocket notification channel parity not implemented on Java side.
- Integration tests with Postgres/Redis containers not yet added.
