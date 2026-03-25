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
    @Transactional
    public Map<String, Object> transfer(String studentId, Map<String, Object> request) {
        String userId = getUserId(studentId);
        String senderAccountId = (String) request.get("senderAccountId");
        String receiverAccountId = (String) request.get("receiverAccountId");
        Double amount = Double.parseDouble(request.get("amount").toString());
        String description = (String) request.get("description");

        Account sender = accountPort.findById(senderAccountId)
                .orElseThrow(() -> new RuntimeException("Sender account not found"));
                
        if (!sender.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied to sender account");
        }
        
        Account receiver = accountPort.findById(receiverAccountId)
                .orElseThrow(() -> new RuntimeException("Receiver account not found"));
                
        if (sender.getAvailableBalance() < amount) {
            throw new RuntimeException("Insufficient funds");
        }
        
        // Immediate deduction for internal transfer, no OTP required for MVP test
        sender.setBalance(sender.getBalance() - amount);
        sender.setAvailableBalance(sender.getAvailableBalance() - amount);
        
        receiver.setBalance(receiver.getBalance() + amount);
        receiver.setAvailableBalance(receiver.getAvailableBalance() + amount);
        
        accountPort.saveAccount(sender);
        accountPort.saveAccount(receiver);
        
        Transaction tx = Transaction.builder()
                .userId(userId)
                .senderAccountId(sender.getId())
                .receiverAccountId(receiver.getId())
                .amount(amount)
                .currency(sender.getCurrency())
                .type("TRANSFER")
                .status("COMPLETED")
                .description(description)
                .transactionNumber("TXN-" + System.currentTimeMillis())
                .idempotencyKey(UUID.randomUUID().toString())
                .build();
                
        Transaction savedTx = transactionPort.saveTransaction(tx);

        Map<String, Object> response = new HashMap<>();
        response.put("transactionId", savedTx.getId());
        response.put("status", "COMPLETED");
        response.put("message", "Chuyển tiền thành công.");
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
