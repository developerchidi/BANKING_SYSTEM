package com.chidibank.core.adapter.out.persistence;

import com.chidibank.core.application.port.out.OtpPort;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class RedisOtpAdapter implements OtpPort {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String OTP_KEY_PREFIX = "otp:";

    @Override
    public void saveOtp(String key, String otp, long ttlSeconds) {
        redisTemplate.opsForValue().set(
                OTP_KEY_PREFIX + key,
                otp,
                Duration.ofSeconds(ttlSeconds)
        );
    }

    @Override
    public Optional<String> getOtp(String key) {
        Object otp = redisTemplate.opsForValue().get(OTP_KEY_PREFIX + key);
        return Optional.ofNullable(otp != null ? otp.toString() : null);
    }

    @Override
    public void deleteOtp(String key) {
        redisTemplate.delete(OTP_KEY_PREFIX + key);
    }
}
