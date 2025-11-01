import express from 'express';
import { body, param, query } from 'express-validator';
import { authenticateToken } from '../middleware/auth.middleware';
import { transferLimiter, bankingOperationLimiter } from '../middleware/rate-limiter.middleware';
import { BankingController } from '../controllers/banking.controller';

const router = express.Router();

// All banking routes require authentication
router.use(authenticateToken);

// Validation rules
const createAccountValidation = [
  body('accountType')
    .isIn(['SAVINGS', 'CHECKING', 'FIXED_DEPOSIT'])
    .withMessage('Invalid account type'),
  body('accountName')
    .notEmpty()
    .withMessage('Account name is required')
    .isLength({ max: 100 })
    .withMessage('Account name must not exceed 100 characters'),
  body('currency')
    .optional()
    .isIn(['VND', 'USD', 'EUR', 'GBP', 'JPY'])
    .withMessage('Invalid currency'),
];

const transferValidation = [
  body('fromAccountId')
    .notEmpty()
    .withMessage('From account ID is required'),
  body('toAccountId')
    .notEmpty()
    .withMessage('To account ID is required'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Description must not exceed 255 characters'),
];

const updateAccountLimitsValidation = [
  body('dailyLimit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Daily limit must be positive'),
  body('monthlyLimit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monthly limit must be positive'),
];

// GET /api/banking/accounts - Get user accounts
router.get('/accounts', BankingController.getAccounts);

// GET /api/banking/accounts/lookup - Lookup account by accountNumber (for external transfer)
router.get('/accounts/lookup', BankingController.lookupAccount);

// GET /api/banking/accounts/:accountId - Get specific account
router.get('/accounts/:accountId', param('accountId').notEmpty().withMessage('Account ID is required'), BankingController.getAccountById);

// POST /api/banking/accounts - Create new account
router.post('/accounts', createAccountValidation, bankingOperationLimiter, BankingController.createAccount);

// GET /api/banking/accounts/:accountId/transactions - Get account transactions
router.get('/accounts/:accountId/transactions', param('accountId').notEmpty().withMessage('Account ID is required'), query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'), query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'), query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'), query('endDate').optional().isISO8601().withMessage('End date must be a valid date'), query('type').optional().isIn(['TRANSFER', 'DEPOSIT', 'WITHDRAWAL', 'PAYMENT']).withMessage('Invalid transaction type'), query('status').optional().isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']).withMessage('Invalid transaction status'), BankingController.getAccountTransactions);

// GET /api/banking/accounts/:accountId/statement - Get account statement
router.get('/accounts/:accountId/statement', param('accountId').notEmpty().withMessage('Account ID is required'), query('startDate').isISO8601().withMessage('Start date is required and must be a valid date'), query('endDate').isISO8601().withMessage('End date is required and must be a valid date'), BankingController.getAccountStatement);

// PUT /api/banking/accounts/:accountId/limits - Update account limits
router.put('/accounts/:accountId/limits', param('accountId').notEmpty().withMessage('Account ID is required'), updateAccountLimitsValidation, bankingOperationLimiter, BankingController.updateAccountLimits);

// POST /api/banking/accounts/:accountId/freeze - Freeze/unfreeze account
router.post('/accounts/:accountId/freeze', param('accountId').notEmpty().withMessage('Account ID is required'), body('freeze').isBoolean().withMessage('Freeze status is required'), body('reason').optional().isLength({ max: 255 }).withMessage('Reason must not exceed 255 characters'), bankingOperationLimiter, BankingController.toggleAccountFreeze);

// GET /api/banking/cards - Get user cards
router.get('/cards', BankingController.getCards);

// POST /api/banking/cards - Issue new card
router.post(
  '/cards',
  body('accountId').notEmpty().withMessage('Account ID is required'),
  body('cardType').isIn(['DEBIT', 'CREDIT', 'VIRTUAL']).withMessage('Invalid card type'),
  body('pin').isLength({ min: 4, max: 6 }).withMessage('PIN must be 4-6 digits'),
  BankingController.createCard
);

// GET /api/banking/cards/:cardId - Get specific card
router.get('/cards/:cardId', param('cardId').notEmpty().withMessage('Card ID is required'), BankingController.getCardById);

// PUT /api/banking/cards/:cardId/limits - Update card limits
router.put(
  '/cards/:cardId/limits',
  param('cardId').notEmpty().withMessage('Card ID is required'),
  body('dailyLimit').optional().isFloat({ min: 0 }).withMessage('dailyLimit must be positive'),
  body('monthlyLimit').optional().isFloat({ min: 0 }).withMessage('monthlyLimit must be positive'),
  body('atmDailyLimit').optional().isFloat({ min: 0 }).withMessage('atmDailyLimit must be positive'),
  BankingController.updateCardLimits
);

// POST /api/banking/cards/:cardId/block - Block/unblock card
router.post(
  '/cards/:cardId/block',
  param('cardId').notEmpty().withMessage('Card ID is required'),
  body('block').isBoolean().withMessage('block must be boolean'),
  body('reason').optional().isLength({ max: 255 }),
  BankingController.toggleCardBlock
);

// POST /api/banking/cards/virtual - Create virtual card
router.post(
  '/cards/virtual',
  body('accountId').notEmpty().withMessage('Account ID is required'),
  body('pin').isLength({ min: 4, max: 6 }).withMessage('PIN must be 4-6 digits'),
  BankingController.createVirtualCard
);

// GET /api/banking/verify-account/:accountNumber - Verify account number
router.get('/verify-account/:accountNumber', BankingController.verifyAccountNumber);

// POST /api/banking/transfer - Transfer money (requires OTP verification)
router.post('/transfer', [ body('fromAccountId').notEmpty().withMessage('From account ID is required'), body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'), body('transferType').isIn(['internal', 'external', 'beneficiary']).withMessage('Invalid transfer type'), body('toAccountId').if(body('transferType').not().equals('external')).notEmpty().withMessage('To account ID is required'), body('toAccountNumber').if(body('transferType').equals('external')).notEmpty().withMessage('To account number is required'), body('description').optional().trim().isLength({ max: 255 }).withMessage('Description must not exceed 255 characters'), ], transferLimiter, BankingController.transfer);

// POST /api/banking/transfer/verify-otp - Verify OTP and complete transfer
router.post('/transfer/verify-otp', [ body('transactionId').notEmpty().withMessage('Transaction ID is required'), body('otpCode').notEmpty().withMessage('OTP code is required') ], transferLimiter, BankingController.verifyTransferOtp);

// POST /api/banking/transfer/resend-otp - Resend OTP for pending transfer
router.post('/transfer/resend-otp', [ body('transactionId').notEmpty().withMessage('Transaction ID is required') ], transferLimiter, BankingController.resendTransferOtp);

// GET /api/banking/transactions - Get user transactions
router.get('/transactions', query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'), query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'), query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'), query('endDate').optional().isISO8601().withMessage('End date must be a valid date'), query('type').optional().isIn(['TRANSFER', 'DEPOSIT', 'WITHDRAWAL', 'PAYMENT']).withMessage('Invalid transaction type'), query('status').optional().isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']).withMessage('Invalid transaction status'), query('accountId').optional().notEmpty().withMessage('Account ID must not be empty'), BankingController.getUserTransactions);

// GET /api/banking/users/:userId/accounts - Get user accounts
router.get('/users/:userId/accounts', authenticateToken, BankingController.getUserAccountsAdmin);

// Admin: Deposit money to user account
router.post('/admin/deposit', authenticateToken, body('userId').isString().withMessage('User ID is required'), body('accountId').isString().withMessage('Account ID is required'), body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'), body('description').optional().isString().withMessage('Description must be a string'), body('adminName').optional().isString().withMessage('Admin name must be a string'), BankingController.adminDeposit);

// GET /api/banking/admin/transactions - Get all transactions for admin
router.get('/admin/transactions', query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'), query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'), query('search').optional().isString().withMessage('Search must be a string'), query('type').optional().isIn(['TRANSFER', 'DEPOSIT', 'WITHDRAWAL', 'PAYMENT']).withMessage('Invalid transaction type'), query('status').optional().isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']).withMessage('Invalid transaction status'), BankingController.getAdminTransactions);

// GET /api/banking/transactions/:transactionId - Get specific transaction
router.get('/transactions/:transactionId', param('transactionId').notEmpty().withMessage('Transaction ID is required'), BankingController.getTransactionById);

// POST /api/banking/transactions/:transactionId/cancel - Cancel transaction
router.post('/transactions/:transactionId/cancel', param('transactionId').notEmpty().withMessage('Transaction ID is required'), body('reason').optional().isLength({ max: 255 }).withMessage('Reason must not exceed 255 characters'), bankingOperationLimiter, BankingController.cancelTransaction);

// GET /api/banking/beneficiaries - Get user beneficiaries
router.get('/beneficiaries', BankingController.getBeneficiaries);

// POST /api/banking/beneficiaries - Add beneficiary
router.post('/beneficiaries', body('name').notEmpty().withMessage('Beneficiary name is required'), body('accountNumber').notEmpty().withMessage('Account number is required'), body('bankName').notEmpty().withMessage('Bank name is required'), body('bankCode').notEmpty().withMessage('Bank code is required'), bankingOperationLimiter, BankingController.addBeneficiary);

// DELETE /api/banking/beneficiaries/:beneficiaryId - Remove beneficiary
router.delete('/beneficiaries/:beneficiaryId', param('beneficiaryId').notEmpty().withMessage('Beneficiary ID is required'), bankingOperationLimiter, BankingController.removeBeneficiary);

export default router; 