package com.chidibank.core.application.port.out;

import java.util.Optional;

public interface OtpPort {
    /**
     * Store OTP in Redis with a specific expiration time (TTL).
     * @param key   The unique key (e.g., studentId, email, or composite key)
     * @param otp   The OTP code
     * @param ttlSeconds Time to live in seconds
     */
    void saveOtp(String key, String otp, long ttlSeconds);

    /**
     * Retrieve the OTP for the given key.
     * @param key The unique key
     * @return Optional containing the OTP if it exists and hasn't expired
     */
    Optional<String> getOtp(String key);

    /**
     * Delete the OTP for the given key.
     * @param key The unique key
     */
    void deleteOtp(String key);
}
