package com.chidibank.core.application.port.out;

/**
 * Tham chiếu phiên đăng nhập để rotate token / revoke.
 */
public record LoginSessionHandle(String id, String userId) {
}
