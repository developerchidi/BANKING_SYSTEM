package com.chidibank.core.application.port.out;

import java.time.LocalDateTime;

public interface AuditLogPort {
    void createAuditLog(String userId, String action, String tableName, String recordId, String details);
}
