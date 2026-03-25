package com.chidibank.core.adapter.out.persistence.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", unique = true, nullable = false)
    private UserEntity user;

    @Column()
    private String idNumber;

    @Column()
    private String idType;

    @Column()
    private LocalDateTime idIssueDate;

    @Column()
    private String idIssuePlace;

    @Column()
    private LocalDateTime idExpiryDate;

    @Column(unique = true)
    private String studentId;

    private String cohort;

    private String school;

    @Column()
    private String currentAddress;

    @Column()
    private String permanentAddress;

    @Column()
    private String emergencyContact;

    @Column()
    private String emergencyPhone;

    @Column()
    private String maritalStatus;

    private Integer dependents;

    @Column()
    private String educationLevel;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column()
    private LocalDateTime updatedAt;
}
