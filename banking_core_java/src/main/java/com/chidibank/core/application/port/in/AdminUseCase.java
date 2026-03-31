package com.chidibank.core.application.port.in;

import java.util.Map;

public interface AdminUseCase {
    Map<String, Object> getSystemStats();
    Map<String, Object> getAllUsers(int page, int limit);
    Map<String, Object> getAllTransactions(int page, int limit);
    void updateUserStatus(String userId, boolean isActive, boolean isLocked);
    void approveKyc(String userId);
    void rejectKyc(String userId, String reason);
}
