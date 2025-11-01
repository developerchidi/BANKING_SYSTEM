# Banking System API Documentation

## 🏦 Overview
This is a comprehensive banking system API that provides secure financial services including account management, transactions, and real-time notifications.

## 🔐 Authentication
All API endpoints require JWT authentication except for login/register endpoints.

### Headers Required:
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

## 📱 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `POST /api/auth/2fa/send-code` - Send 2FA code
- `POST /api/auth/2fa/verify` - Verify 2FA code
- `GET /api/auth/me` - Get current user info

### Banking Operations
- `GET /api/banking/accounts` - Get user accounts
- `POST /api/banking/accounts` - Create new account
- `GET /api/banking/accounts/:id/transactions` - Get account transactions
- `POST /api/banking/transfers` - Transfer money
- `GET /api/banking/transactions` - Get user transactions
- `GET /api/banking/cards` - Get user cards
- `POST /api/banking/cards` - Create new card
- `GET /api/banking/beneficiaries` - Get beneficiaries
- `POST /api/banking/beneficiaries` - Add beneficiary

### Real-time Features
- `WebSocket: ws://your-domain/ws/notifications` - Real-time notifications

## 🔒 Security Features
- JWT Token Authentication
- 2FA Support
- Rate Limiting
- KYC Verification
- Role-Based Access Control
- Audit Logging

## 📊 Rate Limits
- Login: 5 attempts per minute
- Transfers: 10 per hour
- General API: 100 requests per minute

## 🌐 WebSocket Notifications
Connect to WebSocket for real-time notifications:
```javascript
const ws = new WebSocket('ws://your-domain/ws/notifications?userId=USER_ID&token=JWT_TOKEN');
ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  console.log('Notification:', notification);
};
```

## 📝 Example Usage

### Login
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});
const { accessToken } = await response.json();
```

### Get Accounts
```javascript
const response = await fetch('/api/banking/accounts', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
const { data } = await response.json();
```

### Transfer Money
```javascript
const response = await fetch('/api/banking/transfers', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fromAccountId: 'account_id',
    toAccountId: 'recipient_account_id',
    amount: 100.00,
    description: 'Transfer description'
  })
});
```

## 🚀 Getting Started
1. Register an account
2. Complete KYC verification
3. Get JWT token from login
4. Use token for all API calls
5. Connect to WebSocket for notifications

## 📞 Support
For API support, contact: api-support@yourbank.com
