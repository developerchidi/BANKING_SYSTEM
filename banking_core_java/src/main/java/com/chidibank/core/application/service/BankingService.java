package com.chidibank.core.application.service;

import com.chidibank.core.application.port.in.BankingUseCase;
import com.chidibank.core.application.port.out.AccountPort;
import com.chidibank.core.application.port.out.UserPort;
import com.chidibank.core.domain.Account;
import com.chidibank.core.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BankingService implements BankingUseCase {

    private final AccountPort accountPort;
    private final UserPort userPort;

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
        // Mocked for Phase 1 MVP
        Map<String, Object> response = new HashMap<>();
        response.put("transactions", new ArrayList<>());
        response.put("total", 0);
        response.put("page", page);
        response.put("limit", limit);
        return response;
    }

    @Override
    public Map<String, Object> transfer(String studentId, Map<String, Object> request) {
        // Stub for Phase 1 transfer initialization (would normally pend OTP)
        Map<String, Object> response = new HashMap<>();
        response.put("transactionId", "txn_" + System.currentTimeMillis());
        response.put("status", "PENDING_OTP");
        response.put("message", "Vui lòng xác thực mã OTP gửi về Email.");
        return response;
    }

    @Override
    public List<Map<String, Object>> getCards(String studentId) {
        return new ArrayList<>(); // Minimal MVP
    }

    @Override
    public List<Map<String, Object>> getBeneficiaries(String studentId) {
        return new ArrayList<>(); // Minimal MVP
    }
}
