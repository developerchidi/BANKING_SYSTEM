package com.chidibank.core.application.service;

import com.chidibank.core.application.port.in.AdminUseCase;
import com.chidibank.core.application.exception.NotFoundException;
import com.chidibank.core.application.port.out.AccountPort;
import com.chidibank.core.application.port.out.AuditLogPort;
import com.chidibank.core.application.port.out.TransactionPort;
import com.chidibank.core.application.port.out.UserPort;
import com.chidibank.core.domain.User;
import com.chidibank.core.domain.Transaction;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService implements AdminUseCase {

    private final UserPort userPort;
    private final TransactionPort transactionPort;
    private final AccountPort accountPort;
    private final AuditLogPort auditLogPort;

    @Override
    public Map<String, Object> getSystemStats() {
        long totalUsers = userPort.countAll();
        long totalTransactions = transactionPort.countAll();
        double totalVolume = transactionPort.totalVolumeCompleted();
        long activeUsers = userPort.countActiveUsers();
        long pendingKyc = userPort.countPendingKyc();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("totalTransactions", totalTransactions);
        stats.put("totalVolume", totalVolume);
        stats.put("activeUsers", activeUsers);
        stats.put("pendingKyc", pendingKyc);
        stats.put("updatedAt", LocalDateTime.now().toString());
        return stats;
    }

    @Override
    public Map<String, Object> getAllUsers(int page, int limit) {
        List<User> users = userPort.findAll(page, limit);
        List<Map<String, Object>> userList = users.stream().map(user -> Map.<String, Object>of(
                "id", user.getId(),
                "email", user.getEmail(),
                "firstName", user.getFirstName(),
                "lastName", user.getLastName(),
                "phone", user.getPhone() == null ? "" : user.getPhone(),
                "isActive", user.isActive(),
                "isLocked", user.isLocked(),
                "kycStatus", user.getKycStatus() == null ? "PENDING" : user.getKycStatus(),
                "accountTier", user.getAccountTier() == null ? "BASIC" : user.getAccountTier(),
                "createdAt", user.getCreatedAt() == null ? "" : user.getCreatedAt().toString()
        )).toList();

        Map<String, Object> response = new HashMap<>();
        response.put("users", userList);
        response.put("total", userPort.countAll());
        response.put("page", page);
        response.put("limit", limit);
        return response;
    }

    @Override
    public Map<String, Object> getAllTransactions(int page, int limit) {
        List<Transaction> transactions = transactionPort.findAll(page, limit);
        List<Map<String, Object>> items = transactions.stream().map(tx -> Map.<String, Object>of(
                "id", tx.getId(),
                "transactionNumber", tx.getTransactionNumber(),
                "type", tx.getType(),
                "category", tx.getCategory(),
                "amount", tx.getAmount(),
                "status", tx.getStatus(),
                "currency", tx.getCurrency(),
                "createdAt", tx.getCreatedAt() == null ? "" : tx.getCreatedAt().toString()
        )).toList();
        Map<String, Object> response = new HashMap<>();
        response.put("transactions", items);
        response.put("total", transactionPort.countAll());
        response.put("page", page);
        response.put("limit", limit);
        return response;
    }

    @Override
    @Transactional
    public void updateUserStatus(String userId, boolean isActive, boolean isLocked) {
        User user = userPort.findById(userId)
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "User not found"));
        user.setActive(isActive);
        user.setLocked(isLocked);
        userPort.saveUser(user);
        
        auditLogPort.createAuditLog("ADMIN", "UPDATE_USER_STATUS", "users", userId, "Active: " + isActive + ", Locked: " + isLocked);
    }

    @Override
    @Transactional
    public void approveKyc(String userId) {
        User user = userPort.findById(userId)
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "User not found"));
        user.setKycVerified(true);
        user.setKycStatus("APPROVED");
        userPort.saveUser(user);
        
        auditLogPort.createAuditLog("ADMIN", "APPROVE_KYC", "users", userId, "KYC Approved");
    }

    @Override
    @Transactional
    public void rejectKyc(String userId, String reason) {
        User user = userPort.findById(userId)
                .orElseThrow(() -> new NotFoundException("USER_NOT_FOUND", "User not found"));
        user.setKycVerified(false);
        user.setKycStatus("REJECTED");
        userPort.saveUser(user);
        
        auditLogPort.createAuditLog("ADMIN", "REJECT_KYC", "users", userId, "Reason: " + reason);
    }
}
