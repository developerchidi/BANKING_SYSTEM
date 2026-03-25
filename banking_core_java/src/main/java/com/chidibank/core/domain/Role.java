package com.chidibank.core.domain;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class Role {
    private String id;
    private String name;
    private String displayName;
    private String description;
    private String permissions; // JSON String
    private int level;
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
