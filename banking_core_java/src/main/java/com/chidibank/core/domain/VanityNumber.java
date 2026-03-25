package com.chidibank.core.domain;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class VanityNumber {
    private String id;
    private String number;
    private String tier;
    private int basePrice;
    private String status; // AVAILABLE, HELD, SOLD
    private LocalDateTime heldUntil;
    private String listedByUserId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
