package com.chidibank.core.infrastructure.config;

public class BankingConstants {
    
    public static class TransactionCategory {
        public static final String INTERNAL_TRANSFER = "INTERNAL_TRANSFER";
        public static final String EXTERNAL_TRANSFER = "EXTERNAL_TRANSFER";
        public static final String BILL_PAYMENT = "BILL_PAYMENT";
    }

    public static class NotificationType {
        public static final String TRANSACTION = "TRANSACTION";
        public static final String SECURITY = "SECURITY";
        public static final String SYSTEM = "SYSTEM";
    }

    public static class Priority {
        public static final String HIGH = "HIGH";
        public static final String MEDIUM = "MEDIUM";
        public static final String LOW = "LOW";
    }

    public static final String SYSTEM_USER = "SYSTEM";
    public static final String ADMIN_USER = "ADMIN";
}
