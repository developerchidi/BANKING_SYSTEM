package com.chidibank.core.adapter.out.persistence.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "security_info")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityInfoEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", unique = true, nullable = false)
    private UserEntity user;

    @Column(columnDefinition = "TEXT")
    private String securityQuestions;

    @Column(columnDefinition = "TEXT")
    private String trustedDevices;

    @Column(columnDefinition = "TEXT")
    private String lastDeviceInfo;

    @Column()
    private LocalDateTime passwordLastChanged;

    @Column(nullable = false)
    private boolean requirePasswordChange;

    @Column()
    private Integer sessionTimeout;

    @Column()
    private String transactionPinHash;

    @Column()
    private LocalDateTime pinUpdatedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column()
    private LocalDateTime updatedAt;
}
