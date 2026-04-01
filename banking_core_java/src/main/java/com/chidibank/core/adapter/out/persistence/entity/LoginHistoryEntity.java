package com.chidibank.core.adapter.out.persistence.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "login_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginHistoryEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", nullable = false)
    private UserEntity user;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime loginTime;

    @Column()
    private String loginLocation;

    @Column()
    private String ipAddress;

    @Column()
    private String userAgent;

    @Column(columnDefinition = "TEXT")
    private String deviceInfo;

    @Builder.Default
    private boolean success = true;

    @Column()
    private String failureReason;

    @Column(nullable = false)
    private boolean twoFactorUsed;
}
