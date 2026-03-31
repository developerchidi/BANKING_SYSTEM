package com.chidibank.core.application.service;

import com.chidibank.core.application.port.in.BankingUseCase;
import com.chidibank.core.application.exception.ForbiddenException;
import com.chidibank.core.application.exception.NotFoundException;
import com.chidibank.core.application.exception.ValidationException;
import com.chidibank.core.application.port.out.AccountPort;
import com.chidibank.core.application.port.out.BeneficiaryPort;
import com.chidibank.core.application.port.out.CardPort;
import com.chidibank.core.application.port.out.TransactionPort;
import com.chidibank.core.application.port.out.UserPort;
import com.chidibank.core.application.port.out.OtpPort;
import com.chidibank.core.application.port.out.AuditLogPort;
import com.chidibank.core.application.port.in.NotificationUseCase;
import com.chidibank.core.domain.enums.TransactionStatus;
import com.chidibank.core.domain.enums.TransactionType;
import com.chidibank.core.domain.Account;
import com.chidibank.core.domain.Beneficiary;
import com.chidibank.core.domain.Card;
import com.chidibank.core.domain.Transaction;
import com.chidibank.core.domain.User;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BankingService implements BankingUseCase {
    private static final Logger log = LoggerFactory.getLogger(BankingService.class);

    private final AccountPort accountPort;
    private final UserPort userPort;
    private final TransactionPort transactionPort;
    private final CardPort cardPort;
    private final BeneficiaryPort beneficiaryPort;
    private final OtpPort otpPort;
    private final AuditLogPort auditLogPort;
    private final EmailService emailService;
    private final NotificationUseCase notificationUseCase;
    private final TierService tierService;

    private static final int MAX_OTP_ATTEMPTS = 5;
    private static final int OTP_TTL_SECONDS = 300;

    private String getUserId(String studentId) {
        return userPort.findByStudentId(studentId)
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "User not found")).getId();
    }

    @Override
    public List<Map<String, Object>> getAccounts(String studentId) {
        String userId = getUserId(studentId);
        List<Account> accounts = accountPort.findByUserId(userId);
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (Account acc : accounts) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", acc.getId());
            map.put("accountNumber", acc.getAccountNumber());
            map.put("accountType", acc.getAccountType());
            map.put("accountName", acc.getAccountName());
            map.put("currency", acc.getCurrency());
            map.put("balance", acc.getBalance());
            map.put("availableBalance", acc.getAvailableBalance());
            map.put("isActive", acc.isActive());
            map.put("isFrozen", acc.isFrozen());
            map.put("createdAt", acc.getCreatedAt() != null ? acc.getCreatedAt().toString() : null);
            result.add(map);
        }
        return result;
    }

    @Override
    public Map<String, Object> getAccountById(String studentId, String accountId) {
        String userId = getUserId(studentId);
        Account acc = accountPort.findById(accountId)
                .orElseThrow(() -> new NotFoundException("ACCOUNT_NOT_FOUND", "Account not found"));
                
        if (!acc.getUserId().equals(userId)) {
            throw new ForbiddenException("ACCOUNT_ACCESS_DENIED", "Access denied to this account");
        }
                
        Map<String, Object> map = new HashMap<>();
        map.put("id", acc.getId());
        map.put("accountNumber", acc.getAccountNumber());
        map.put("accountType", acc.getAccountType());
        map.put("accountName", acc.getAccountName());
        map.put("currency", acc.getCurrency());
        map.put("balance", acc.getBalance());
        map.put("availableBalance", acc.getAvailableBalance());
        map.put("isActive", acc.isActive());
        map.put("isFrozen", acc.isFrozen());
        map.put("dailyLimit", acc.getDailyLimit());
        map.put("monthlyLimit", acc.getMonthlyLimit());
        map.put("interestRate", acc.getInterestRate());
        
        return map;
    }

    @Override
    public Map<String, Object> createAccount(String studentId, Map<String, Object> request) {
        String userId = getUserId(studentId);
        
        Account acc = Account.builder()
                .userId(userId)
                .accountNumber(String.valueOf(System.currentTimeMillis()).substring(2))
                .accountType((String) request.getOrDefault("accountType", "SAVINGS"))
                .accountName((String) request.getOrDefault("accountName", "New Account"))
                .currency((String) request.getOrDefault("currency", "VND"))
                .balance(0.0)
                .availableBalance(0.0)
                .isActive(true)
                .isFrozen(false)
                .build();
                
        Account saved = accountPort.saveAccount(acc);
        return getAccountById(studentId, saved.getId());
    }

    @Override
    public void updateAccountLimits(String studentId, String accountId, Map<String, Object> request) {
        String userId = getUserId(studentId);
        Account acc = accountPort.findById(accountId)
                .orElseThrow(() -> new NotFoundException("ACCOUNT_NOT_FOUND", "Account not found"));
                
        if (!acc.getUserId().equals(userId)) {
            throw new ForbiddenException("ACCOUNT_ACCESS_DENIED", "Access denied to this account");
        }
        
        if (request.containsKey("dailyLimit")) {
            acc.setDailyLimit(Double.parseDouble(request.get("dailyLimit").toString()));
        }
        if (request.containsKey("monthlyLimit")) {
            acc.setMonthlyLimit(Double.parseDouble(request.get("monthlyLimit").toString()));
        }
        
        accountPort.saveAccount(acc);
    }

    @Override
    public Map<String, Object> getTransactions(String studentId, String accountId, int page, int limit) {
        String userId = getUserId(studentId);
        Account acc = accountPort.findById(accountId)
                .orElseThrow(() -> new NotFoundException("ACCOUNT_NOT_FOUND", "Account not found"));
                
        if (!acc.getUserId().equals(userId)) {
            throw new ForbiddenException("ACCOUNT_ACCESS_DENIED", "Access denied to this account");
        }

        List<Transaction> allTxs = transactionPort.findByAccountId(accountId);
        
        // Manual pagination (For MVP Phase 1)
        int start = Math.min((page - 1) * limit, allTxs.size());
        int end = Math.min(start + limit, allTxs.size());
        List<Transaction> pagedTxs = allTxs.subList(start, end);
        
        List<Map<String, Object>> responseList = new ArrayList<>();
        for (Transaction tx : pagedTxs) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", tx.getId());
            map.put("transactionNumber", tx.getTransactionNumber());
            map.put("type", tx.getType());
            map.put("amount", tx.getAmount());
            map.put("currency", tx.getCurrency());
            map.put("description", tx.getDescription());
            map.put("status", tx.getStatus());
            map.put("createdAt", tx.getCreatedAt() != null ? tx.getCreatedAt().toString() : null);
            responseList.add(map);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("transactions", responseList);
        response.put("total", allTxs.size());
        response.put("page", page);
        response.put("limit", limit);
        return response;
    }

    @Override
    public Map<String, Object> getUserTransactions(String studentId, Map<String, Object> queryParams) {
        String userId = getUserId(studentId);
        List<Transaction> allTxs = transactionPort.findByUserId(userId);
        
        // Filter by accountId if provided
        String accountId = (String) queryParams.get("accountId");
        if (accountId != null && !accountId.isEmpty()) {
            allTxs = allTxs.stream()
                .filter(tx -> tx.getSenderAccountId() != null && tx.getSenderAccountId().equals(accountId) || 
                              tx.getReceiverAccountId() != null && tx.getReceiverAccountId().equals(accountId))
                .collect(Collectors.toList());
        }

        int page = Integer.parseInt(queryParams.getOrDefault("page", "1").toString());
        int limit = Integer.parseInt(queryParams.getOrDefault("limit", "20").toString());

        int start = Math.min((page - 1) * limit, allTxs.size());
        int end = Math.min(start + limit, allTxs.size());
        List<Transaction> pagedTxs = allTxs.subList(start, end);

        List<Map<String, Object>> responseList = new ArrayList<>();
        for (Transaction tx : pagedTxs) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", tx.getId());
            map.put("transactionNumber", tx.getTransactionNumber());
            map.put("type", tx.getType());
            map.put("category", tx.getCategory());
            map.put("amount", tx.getAmount());
            map.put("currency", tx.getCurrency());
            map.put("description", tx.getDescription());
            map.put("status", tx.getStatus());
            map.put("createdAt", tx.getCreatedAt() != null ? tx.getCreatedAt().toString() : null);
            responseList.add(map);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("transactions", responseList);
        response.put("total", allTxs.size());
        response.put("page", page);
        response.put("limit", limit);
        return response;
    }

    @Override
    public Map<String, Object> verifyAccount(String accountNumber) {
        Account acc = accountPort.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new NotFoundException("ACCOUNT_NOT_FOUND", "Không tìm thấy tài khoản"));
                
        Map<String, Object> data = new HashMap<>();
        data.put("accountId", acc.getId());
        data.put("accountNumber", acc.getAccountNumber());
        data.put("accountName", acc.getAccountName());
        data.put("accountType", acc.getAccountType());
        data.put("currency", acc.getCurrency());
        data.put("isActive", acc.isActive());
        
        return data;
    }

    @Override
    public Map<String, Object> getDashboardSummary(String studentId) {
        String userId = getUserId(studentId);
        List<Account> accounts = accountPort.findByUserId(userId);
        double totalBalance = accounts.stream().mapToDouble(Account::getBalance).sum();
        
        Map<String, Object> data = new HashMap<>();
        data.put("totalBalance", totalBalance);
        data.put("accountCount", accounts.size());
        data.put("currency", accounts.isEmpty() ? "VND" : accounts.get(0).getCurrency());
        
        // Add accounts list as expected by Flutter
        List<Map<String, Object>> accountSummaries = accounts.stream().map(acc -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", acc.getId());
            map.put("accountNumber", acc.getAccountNumber());
            map.put("balance", acc.getBalance());
            map.put("availableBalance", acc.getAvailableBalance());
            map.put("accountName", acc.getAccountName());
            map.put("accountType", acc.getAccountType());
            map.put("currency", acc.getCurrency());
            return map;
        }).collect(Collectors.toList());
        data.put("accounts", accountSummaries);
        
        return data;
    }

    @Override
    @Transactional
    public Map<String, Object> transfer(String studentId, Map<String, Object> request) {
        String userId = getUserId(studentId);
        User actingUser = userPort.findById(userId)
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "User not found"));
        assertKycAllowsSensitiveOperation(actingUser);

        String fromAccountId = String.valueOf(request.get("fromAccountId"));
        String toAccountNumber = String.valueOf(request.get("toAccountNumber"));
        double amount = Double.parseDouble(request.getOrDefault("amount", "0").toString());
        String description = (String) request.getOrDefault("description", "Transfer");
        String idempotencyKey = (String) request.getOrDefault(
                "idempotencyKey", studentId + ":" + fromAccountId + ":" + toAccountNumber + ":" + amount);

        if (amount <= 0) {
            throw new ValidationException("INVALID_AMOUNT", "Amount must be greater than zero");
        }

        Transaction existingByKey = transactionPort.findByIdempotencyKey(idempotencyKey).orElse(null);
        if (existingByKey != null) {
            Map<String, Object> data = new HashMap<>();
            data.put("transactionId", existingByKey.getId());
            data.put("transactionNumber", existingByKey.getTransactionNumber());
            data.put("status", existingByKey.getStatus());
            data.put("amount", existingByKey.getAmount());
            data.put("requiresOtp", TransactionStatus.PENDING.name().equals(existingByKey.getStatus()));
            return data;
        }

        // 1. Check sender account
        Account fromAcc = accountPort.findByIdForUpdate(fromAccountId)
                .orElseThrow(() -> new NotFoundException("SOURCE_ACCOUNT_NOT_FOUND", "Tài khoản nguồn không tồn tại"));

        if (!fromAcc.getUserId().equals(userId)) {
            throw new ForbiddenException("SOURCE_ACCOUNT_ACCESS_DENIED", "Bạn không quyền sử dụng tài khoản này");
        }

        if (fromAcc.isFrozen() || !fromAcc.isActive()) {
            throw new ValidationException("SOURCE_ACCOUNT_INVALID_STATE", "Tài khoản đang bị khóa hoặc chưa kích hoạt");
        }

        if (fromAcc.getAvailableBalance() < amount) {
            throw new ValidationException("INSUFFICIENT_FUNDS", "Số dư không đủ");
        }

        LocalDateTime dayStart = LocalDateTime.now().with(LocalTime.MIN);
        LocalDateTime monthStart = LocalDateTime.now().withDayOfMonth(1).with(LocalTime.MIN);
        double dayOut = transactionPort.sumCompletedOutgoingFromAccountSince(fromAcc.getId(), dayStart);
        double monthOut = transactionPort.sumCompletedOutgoingFromAccountSince(fromAcc.getId(), monthStart);
        if (fromAcc.getDailyLimit() != null && fromAcc.getDailyLimit() > 0 && dayOut + amount > fromAcc.getDailyLimit()) {
            throw new ValidationException("DAILY_LIMIT_EXCEEDED", "Vượt hạn mức giao dịch trong ngày");
        }
        if (fromAcc.getMonthlyLimit() != null && fromAcc.getMonthlyLimit() > 0
                && monthOut + amount > fromAcc.getMonthlyLimit()) {
            throw new ValidationException("MONTHLY_LIMIT_EXCEEDED", "Vượt hạn mức giao dịch trong tháng");
        }

        // 2. Find receiver account
        Account toAcc = accountPort.findByAccountNumberForUpdate(toAccountNumber)
                .orElseThrow(() -> new NotFoundException("DESTINATION_ACCOUNT_NOT_FOUND", "Tài khoản đích không tồn tại"));

        if (!toAcc.isActive() || toAcc.isFrozen()) {
            throw new ValidationException("DESTINATION_ACCOUNT_INVALID_STATE", "Tài khoản người nhận không khả dụng");
        }

        // 3. Create Pending Transaction
        Transaction tx = Transaction.builder()
                .id(UUID.randomUUID().toString())
                .transactionNumber("TXN" + System.currentTimeMillis())
                .type(TransactionType.TRANSFER.name())
                .category("INTERNAL_TRANSFER")
                .amount(amount)
                .fee(0.0)
                .currency(fromAcc.getCurrency())
                .description(description)
                .status(TransactionStatus.PENDING.name())
                .idempotencyKey(idempotencyKey)
                .senderAccountId(fromAcc.getId())
                .receiverAccountId(toAcc.getId())
                .userId(userId)
                .createdAt(LocalDateTime.now())
                .build();

        Transaction savedTx = transactionPort.saveTransaction(tx);

        // 4. Generate and Save OTP in Redis (TTL: 5 mins)
        String otp = String.format("%06d", (int) (Math.random() * 1000000));
        otpPort.saveOtp("TX_OTP:" + savedTx.getId(), otp, OTP_TTL_SECONDS);
        otpPort.saveOtp("TX_OTP_ATTEMPTS:" + savedTx.getId(), "0", OTP_TTL_SECONDS);

        // 5. Send Real Email
        User user = userPort.findById(userId)
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "User not found"));
        emailService.sendTransferOtp(user.getEmail(), otp);

        // 6. Audit Log
        auditLogPort.createAuditLog(userId, "TRANSFER_INITIATED", "transactions", savedTx.getId(),
                String.format("Amount: %s, To: ***%s", amount, lastDigits(toAccountNumber, 4)));

        Map<String, Object> data = new HashMap<>();
        data.put("transactionId", savedTx.getId());
        data.put("transactionNumber", savedTx.getTransactionNumber());
        data.put("status", TransactionStatus.PENDING.name());
        data.put("amount", amount);
        data.put("fee", 0.0);
        data.put("fromAccount", fromAcc.getAccountNumber());
        data.put("toAccountNumber", toAccountNumber);
        data.put("requiresOtp", true);
        
        return data;
    }

    @Override
    @Transactional
    public Map<String, Object> verifyTransferOtp(String studentId, Map<String, Object> request) {
        String userId = getUserId(studentId);
        String transactionId = (String) request.get("transactionId");
        String otpCode = (String) request.get("otpCode");

        // 1. Verify OTP and Attempts
        String attemptsKey = "TX_OTP_ATTEMPTS:" + transactionId;
        int attempts = Integer.parseInt(otpPort.getOtp(attemptsKey).orElse("0"));
        
        if (attempts >= MAX_OTP_ATTEMPTS) {
            throw new ValidationException("OTP_ATTEMPTS_EXCEEDED", "Bạn đã nhập sai OTP quá nhiều lần. Giao dịch bị hủy.");
        }

        String savedOtp = otpPort.getOtp("TX_OTP:" + transactionId)
                .orElseThrow(() -> new ValidationException("OTP_EXPIRED", "Mã OTP đã hết hạn hoặc không tồn tại"));

        if (!savedOtp.equals(otpCode)) {
            otpPort.saveOtp(attemptsKey, String.valueOf(attempts + 1), OTP_TTL_SECONDS);
            throw new ValidationException("OTP_INVALID", "Mã OTP không đúng. Bạn còn " + (MAX_OTP_ATTEMPTS - attempts - 1) + " lần thử.");
        }

        // 2. Get Transaction
        Transaction tx = transactionPort.findById(transactionId)
                .orElseThrow(() -> new NotFoundException("TRANSACTION_NOT_FOUND", "Giao dịch không tồn tại"));

        if (!tx.getStatus().equals(TransactionStatus.PENDING.name())) {
            throw new ValidationException("TRANSACTION_STATE_INVALID", "Giao dịch không ở trạng thái chờ xác thực");
        }

        // 3. Execution (Atomic)
        Account fromAcc = accountPort.findByIdForUpdate(tx.getSenderAccountId())
                .orElseThrow(() -> new NotFoundException("SOURCE_ACCOUNT_NOT_FOUND", "Tài khoản nguồn không tồn tại"));
        Account toAcc = accountPort.findByIdForUpdate(tx.getReceiverAccountId())
                .orElseThrow(() -> new NotFoundException("DESTINATION_ACCOUNT_NOT_FOUND", "Tài khoản đích không tồn tại"));

        // Final balance check
        if (fromAcc.getAvailableBalance() < tx.getAmount()) {
            tx.setStatus(TransactionStatus.FAILED.name());
            tx.setFailureReason("Insufficient funds at execution time");
            transactionPort.saveTransaction(tx);
            throw new ValidationException("INSUFFICIENT_FUNDS_EXECUTION", "Số dư không đủ tại thời điểm thực hiện");
        }

        // Update balances
        fromAcc.setBalance(fromAcc.getBalance() - tx.getAmount());
        fromAcc.setAvailableBalance(fromAcc.getAvailableBalance() - tx.getAmount());
        
        toAcc.setBalance(toAcc.getBalance() + tx.getAmount());
        toAcc.setAvailableBalance(toAcc.getAvailableBalance() + tx.getAmount());

        // Save accounts
        accountPort.saveAccount(fromAcc);
        accountPort.saveAccount(toAcc);

        // Update Transaction
        tx.setStatus(TransactionStatus.COMPLETED.name());
        tx.setProcessedAt(LocalDateTime.now());
        transactionPort.saveTransaction(tx);

        // Cleanup OTP
        otpPort.deleteOtp("TX_OTP:" + transactionId);
        otpPort.deleteOtp(attemptsKey);

        // 4. Send Confirmation Email & Web Notification
        User user = userPort.findById(userId)
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "User not found"));
        emailService.sendTransactionConfirmation(user.getEmail(), tx.getTransactionNumber(), tx.getAmount(), toAcc.getAccountNumber());
        
        notificationUseCase.createNotification(
            "Giao dịch thành công", 
            "Bạn đã chuyển thành công " + tx.getAmount() + " VND cho tài khoản " + toAcc.getAccountNumber(), 
            List.of(userId), "SYSTEM", "TRANSACTION", "HIGH", null, "/transactions/" + tx.getId());

        // 5. Check and Upgrade Tiers for both
        tierService.checkAndUpgradeTier(userId);
        tierService.checkAndUpgradeTier(toAcc.getUserId());

        // Audit Log
        auditLogPort.createAuditLog(userId, "TRANSFER_COMPLETED", "transactions", tx.getId(), 
            String.format("Transfer of %s completed", tx.getAmount()));

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Giao dịch thành công");
        response.put("transactionId", tx.getId());
        
        Map<String, Object> txData = new HashMap<>();
        txData.put("status", TransactionStatus.COMPLETED.name());
        txData.put("processedAt", tx.getProcessedAt().toString());
        response.put("transaction", txData);
        
        return response;
    }

    @Override
    public Map<String, Object> resendTransferOtp(String studentId, Map<String, Object> request) {
        String transactionId = (String) request.get("transactionId");
        Transaction tx = transactionPort.findById(transactionId)
                .orElseThrow(() -> new NotFoundException("TRANSACTION_NOT_FOUND", "Giao dịch không tồn tại"));
        if (!TransactionStatus.PENDING.name().equals(tx.getStatus())) {
            throw new ValidationException("TRANSACTION_STATE_INVALID", "Chỉ có thể gửi lại OTP cho giao dịch đang chờ xử lý");
        }
        String userId = getUserId(studentId);
        if (!userId.equals(tx.getUserId())) {
            throw new ForbiddenException("TRANSACTION_ACCESS_DENIED", "Bạn không có quyền thao tác giao dịch này");
        }
        User user = userPort.findById(userId)
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "User not found"));
        String otp = String.format("%06d", (int) (Math.random() * 1000000));
        otpPort.saveOtp("TX_OTP:" + tx.getId(), otp, OTP_TTL_SECONDS);
        otpPort.saveOtp("TX_OTP_ATTEMPTS:" + tx.getId(), "0", OTP_TTL_SECONDS);
        emailService.sendTransferOtp(user.getEmail(), otp);
        log.info("Resent OTP for transaction {}", tx.getId());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Đã gửi lại mã OTP");
        return response;
    }

    @Override
    public List<Map<String, Object>> getCards(String studentId) {
        String userId = getUserId(studentId);
        List<Card> cards = cardPort.findByUserId(userId);
        
        List<Map<String, Object>> response = new ArrayList<>();
        for (Card card : cards) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", card.getId());
            map.put("cardNumber", maskCardPan(card.getCardNumber()));
            map.put("cardType", card.getCardType());
            map.put("cardBrand", card.getCardBrand());
            map.put("expiryMonth", card.getExpiryMonth());
            map.put("expiryYear", card.getExpiryYear());
            map.put("cardholderName", card.getCardholderName());
            map.put("isActive", card.isActive());
            map.put("isBlocked", card.isBlocked());
            map.put("dailyLimit", card.getDailyLimit());
            map.put("monthlyLimit", card.getMonthlyLimit());
            response.add(map);
        }
        return response;
    }

    private static void assertKycAllowsSensitiveOperation(User user) {
        boolean ok = user.isKycVerified() || "VERIFIED".equalsIgnoreCase(user.getKycStatus());
        if (!ok) {
            throw new ForbiddenException("KYC_REQUIRED", "Cần hoàn tất xác minh KYC để thực hiện giao dịch");
        }
    }

    private static String lastDigits(String value, int n) {
        if (value == null || value.length() < n) {
            return "****";
        }
        return value.substring(value.length() - n);
    }

    private static String maskCardPan(String pan) {
        if (pan == null || pan.length() < 4) {
            return "****";
        }
        return "**** **** **** " + pan.substring(pan.length() - 4);
    }

    @Override
    public List<Map<String, Object>> getBeneficiaries(String studentId) {
        String userId = getUserId(studentId);
        List<Beneficiary> beneficiaries = beneficiaryPort.findByUserId(userId);
        
        List<Map<String, Object>> response = new ArrayList<>();
        for (Beneficiary ben : beneficiaries) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", ben.getId());
            map.put("name", ben.getName());
            map.put("nickname", ben.getNickname());
            map.put("bankCode", ben.getBankCode());
            map.put("accountNumber", ben.getAccountNumber());
            map.put("accountName", ben.getAccountName());
            map.put("bankName", ben.getBankName());
            map.put("isActive", ben.isActive());
            map.put("isVerified", ben.isVerified());
            response.add(map);
        }
        return response;
    }
}
