package com.chidibank.core.application.port.out;

import com.chidibank.core.domain.Notification;
import java.util.List;
import java.util.Optional;

public interface NotificationPort {
    Notification save(Notification notification);
    Optional<Notification> findById(String id);
    List<Notification> findByUserId(String userId, int limit, int offset);
    long countUnreadByUserId(String userId);
    void markAsRead(String id);
    void markAllAsRead(String userId);
    void delete(String id);
}
