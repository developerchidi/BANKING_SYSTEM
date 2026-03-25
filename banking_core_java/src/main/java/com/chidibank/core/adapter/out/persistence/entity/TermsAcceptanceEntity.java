package com.chidibank.core.adapter.out.persistence.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "terms_acceptances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TermsAcceptanceEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", nullable = false)
    private UserEntity user;

    @Column(nullable = false)
    private String termsVersion;

    @Column(nullable = false)
    private String termsType;

    @Column()
    private String ipAddress;

    @Column()
    private String userAgent;

    @Column()
    private String acceptanceMethod;

    @Column(columnDefinition = "TEXT")
    private String deviceInfo;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime acceptedAt = LocalDateTime.now();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column()
    private LocalDateTime updatedAt;
}
