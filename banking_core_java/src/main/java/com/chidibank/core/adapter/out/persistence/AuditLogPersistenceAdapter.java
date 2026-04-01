package com.chidibank.core.adapter.out.persistence;

import com.chidibank.core.adapter.out.persistence.entity.AuditLogEntity;
import com.chidibank.core.adapter.out.persistence.entity.UserEntity;
import com.chidibank.core.adapter.out.persistence.repository.AuditLogRepository;
import com.chidibank.core.adapter.out.persistence.repository.UserRepository;
import com.chidibank.core.application.port.out.AuditLogPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class AuditLogPersistenceAdapter implements AuditLogPort {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Override
    public void createAuditLog(String userId, String action, String tableName, String recordId, String details) {
        UserEntity user = userRepository.findById(userId).orElse(null);
        
        AuditLogEntity auditLog = AuditLogEntity.builder()
                .user(user)
                .action(action)
                .tableName(tableName)
                .recordId(recordId)
                .newValues(details)
                .build();
        
        auditLogRepository.save(auditLog);
    }
}
