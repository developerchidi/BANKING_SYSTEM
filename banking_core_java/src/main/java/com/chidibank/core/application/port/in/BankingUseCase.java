package com.chidibank.core.application.port.in;

import java.util.Map;
import java.util.List;

public interface BankingUseCase {
    List<Map<String, Object>> getAccounts(String userId);
    Map<String, Object> getAccountById(String userId, String accountId);
    Map<String, Object> createAccount(String userId, Map<String, Object> request);
    void updateAccountLimits(String userId, String accountId, Map<String, Object> request);
    
    // Transactions
    Map<String, Object> getTransactions(String userId, String accountId, int page, int limit);
    Map<String, Object> transfer(String userId, Map<String, Object> request);
    
    // Virtual items (beneficiaries, cards mapped simply for Phase 1 MVP)
    List<Map<String, Object>> getCards(String userId);
    List<Map<String, Object>> getBeneficiaries(String userId);
}
