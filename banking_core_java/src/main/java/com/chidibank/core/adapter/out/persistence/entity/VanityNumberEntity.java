package com.chidibank.core.adapter.out.persistence.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "vanity_numbers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VanityNumberEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String number;

    @Column(nullable = false)
    private String tier;

    @Column(nullable = false)
    @Builder.Default
    private int basePrice = 0;

    @Column(nullable = false)
    @Builder.Default
    private String status = "AVAILABLE";

    @Column()
    private LocalDateTime heldUntil;

    @Column()
    private String listedByUserId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column()
    private LocalDateTime updatedAt;
}
