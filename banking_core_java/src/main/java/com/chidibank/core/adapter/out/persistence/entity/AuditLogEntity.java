package com.chidibank.core.adapter.out.persistence.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", nullable = false)
    private UserEntity user;

    @Column(nullable = false)
    private String action;

    @Column(name = "tableName")
    private String tableName;

    @Column(name = "recordId")
    private String recordId;

    @Column(name = "oldValues", columnDefinition = "TEXT")
    private String oldValues;

    @Column(name = "newValues", columnDefinition = "TEXT")
    private String newValues;

    @Column()
    private String ipAddress;

    @Column()
    private String userAgent;

    @Column()
    private String sessionId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
