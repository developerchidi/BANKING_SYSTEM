package com.chidibank.core.adapter.out.persistence.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "kyc_requests", indexes = {
    @Index(name = "idx_kyc_user_status", columnList = "userId, status"),
    @Index(name = "idx_kyc_status_submitted", columnList = "status, submittedAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KYCRequestEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", nullable = false)
    private UserEntity user;

    @Column(nullable = false)
    private String documentType;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING";

    @Column(columnDefinition = "TEXT", nullable = false)
    private String frontImage;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String backImage;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String selfieImage;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String extractedData;

    @Column()
    @Builder.Default
    private LocalDateTime submittedAt = LocalDateTime.now();

    @Column()
    private LocalDateTime reviewedAt;

    @Column()
    private String reviewedBy;

    @Column()
    private String rejectionReason;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column()
    private LocalDateTime updatedAt;
}
