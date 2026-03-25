package com.chidibank.core.application.port.in;

import com.chidibank.core.domain.Notification;
import java.util.List;

public interface NotificationUseCase {
    List<Notification> getNotifications(String userId, int limit, int offset);
    Notification getNotificationById(String id);
    void markAsRead(String id);
    void markAllAsRead(String userId);
    long getUnreadCount(String userId);
    void deleteNotification(String id);
    List<Notification> createNotification(String title, String content, List<String> receiverIds, String senderId, String type, String priority, String metadata, String actionUrl);
}
