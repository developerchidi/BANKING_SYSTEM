package com.chidibank.core.adapter.out.persistence.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "employment_info")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmploymentInfoEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", unique = true, nullable = false)
    private UserEntity user;

    @Column()
    private String employmentStatus;

    @Column()
    private String employerName;

    @Column()
    private String employerAddress;

    @Column()
    private String employerPhone;

    @Column()
    private String jobTitle;

    private String department;

    @Column()
    private LocalDateTime employmentDate;

    @Column()
    private Double annualIncome;

    @Column()
    private String sourceOfFunds;

    @Column()
    private Double expectedMonthlyTransactions;

    @Column()
    private String businessName;

    @Column()
    private String businessType;

    @Column()
    private String businessAddress;

    @Column()
    private String businessLicense;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column()
    private LocalDateTime updatedAt;
}
