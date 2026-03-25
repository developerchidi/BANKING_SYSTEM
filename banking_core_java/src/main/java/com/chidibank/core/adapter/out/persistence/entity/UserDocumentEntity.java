package com.chidibank.core.adapter.out.persistence.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDocumentEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", nullable = false)
    private UserEntity user;

    @Column(nullable = false)
    private String documentType;

    @Column(nullable = false)
    private String documentUrl;

    @Column(nullable = false)
    private String documentName;

    @Column()
    private Integer fileSize;

    @Column()
    private String mimeType;

    @Column()
    private String idNumber;

    @Column(nullable = false)
    @Builder.Default
    private String verificationStatus = "PENDING";

    @Column()
    private String verificationNotes;

    @Column()
    private String verifiedBy;

    @Column()
    private LocalDateTime verifiedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column()
    private LocalDateTime updatedAt;
}
