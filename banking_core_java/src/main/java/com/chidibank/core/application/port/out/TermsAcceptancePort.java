package com.chidibank.core.application.port.out;

public interface TermsAcceptancePort {
    void createAcceptance(String userId, String termsVersion, String termsType, String ipAddress, String userAgent);
}
