package com.chidibank.core.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

/**
 * Gắn X-Request-Id + MDC và rate limit cơ bản cho login/register/transfer.
 */
@Component
@RequiredArgsConstructor
public class RequestContextAndRateLimitFilter extends OncePerRequestFilter {

    private final StringRedisTemplate stringRedisTemplate;

    @Value("${app.rate-limit.login-per-minute:60}")
    private int loginPerMinute;

    @Value("${app.rate-limit.transfer-per-minute:40}")
    private int transferPerMinute;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        String rid = request.getHeader("X-Request-Id");
        if (rid == null || rid.isBlank()) {
            rid = UUID.randomUUID().toString();
        }
        response.setHeader("X-Request-Id", rid);
        MDC.put("requestId", rid);
        try {
            if (shouldRateLimit(request) && isOverLimit(request)) {
                response.setStatus(429);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write(
                        "{\"success\":false,\"code\":\"RATE_LIMIT\",\"message\":\"Too many requests\"}");
                return;
            }
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove("requestId");
        }
    }

    private boolean shouldRateLimit(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return false;
        }
        String uri = request.getRequestURI();
        return uri.contains("/auth/login")
                || uri.contains("/auth/register")
                || uri.contains("/banking/transfer");
    }

    private boolean isOverLimit(HttpServletRequest request) {
        String uri = request.getRequestURI();
        int max = uri.contains("/banking/transfer") ? transferPerMinute : loginPerMinute;
        String ip = Optional.ofNullable(request.getHeader("X-Forwarded-For"))
                .map(h -> h.split(",")[0].trim())
                .orElse(request.getRemoteAddr());
        String key = "rl:" + request.getMethod() + ":" + uri + ":" + ip;
        Long count = stringRedisTemplate.opsForValue().increment(key);
        if (count != null && count == 1L) {
            stringRedisTemplate.expire(key, Duration.ofMinutes(1));
        }
        return count != null && count > max;
    }
}
