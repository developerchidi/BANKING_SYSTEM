package com.chidibank.core.application.service;

import com.chidibank.core.application.port.in.BankingUseCase;
import com.chidibank.core.application.port.out.AccountPort;
import com.chidibank.core.application.port.out.BeneficiaryPort;
import com.chidibank.core.application.port.out.CardPort;
import com.chidibank.core.application.port.out.TransactionPort;
import com.chidibank.core.application.port.out.UserPort;
import com.chidibank.core.domain.Account;
import com.chidibank.core.domain.Beneficiary;
import com.chidibank.core.domain.Card;
import com.chidibank.core.domain.Transaction;
import com.chidibank.core.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BankingService implements BankingUseCase {

    private final AccountPort accountPort;
    private final UserPort userPort;
    private final TransactionPort transactionPort;
    private final CardPort cardPort;
    private final BeneficiaryPort beneficiaryPort;

    private String getUserId(String studentId) {
        return userPort.findByStudentId(studentId)
                .orElseThrow(() -> new RuntimeException("User not found")).getId();
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
                .orElseThrow(() -> new RuntimeException("Account not found"));
                
        if (!acc.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied to this account");
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
                .orElseThrow(() -> new RuntimeException("Account not found"));
                
        if (!acc.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied to this account");
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
                .orElseThrow(() -> new RuntimeException("Account not found"));
                
        if (!acc.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied to this account");
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
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));
                
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
        String fromAccountId = (String) request.get("fromAccountId");
        String toAccountNumber = (String) request.get("toAccountNumber");
        double amount = Double.parseDouble(request.getOrDefault("amount", "0").toString());

        Account fromAcc = accountPort.findById(fromAccountId)
                .orElseThrow(() -> new RuntimeException("Tài khoản nguồn không tồn tại"));

        if (fromAcc.getAvailableBalance() < amount) {
            throw new RuntimeException("Số dư không đủ");
        }

        // Return requiresOtp to match legacy flow; we simulate the creation of a pending transaction.
        String transactionId = UUID.randomUUID().toString();
        
        Map<String, Object> data = new HashMap<>();
        data.put("transactionId", transactionId);
        data.put("transactionNumber", "TXN" + System.currentTimeMillis());
        data.put("status", "PENDING");
        data.put("amount", amount);
        data.put("fee", 0.0);
        data.put("fromAccount", fromAcc.getAccountNumber());
        data.put("toAccountNumber", toAccountNumber); // Parity with Flutter expectation
        data.put("requiresOtp", true);
        
        return data;
    }

    @Override
    @Transactional
    public Map<String, Object> verifyTransferOtp(String studentId, Map<String, Object> request) {
        // String userId = getUserId(studentId);
        String otpCode = (String) request.get("otpCode");

        if (!"123456".equals(otpCode)) {
            throw new RuntimeException("Mã OTP không đúng");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        Map<String, Object> tx = new HashMap<>();
        tx.put("status", "COMPLETED");
        response.put("transaction", tx);
        return response;
    }

    @Override
    public Map<String, Object> resendTransferOtp(String studentId, Map<String, Object> request) {
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
            map.put("cardNumber", card.getCardNumber());
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
