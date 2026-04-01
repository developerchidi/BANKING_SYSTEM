package com.chidibank.core.application.service;

import com.chidibank.core.application.port.in.NotificationUseCase;
import com.chidibank.core.application.port.out.NotificationPort;
import com.chidibank.core.domain.Notification;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService implements NotificationUseCase {

    private final NotificationPort notificationPort;

    @Override
    public List<Notification> getNotifications(String userId, int limit, int offset) {
        return notificationPort.findByUserId(userId, limit, offset);
    }

    @Override
    public Notification getNotificationById(String id) {
        return notificationPort.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
    }

    @Override
    public void markAsRead(String id) {
        notificationPort.markAsRead(id);
    }

    @Override
    public void markAllAsRead(String userId) {
        notificationPort.markAllAsRead(userId);
    }

    @Override
    public long getUnreadCount(String userId) {
        return notificationPort.countUnreadByUserId(userId);
    }

    @Override
    public void deleteNotification(String id) {
        notificationPort.delete(id);
    }

    @Override
    public List<Notification> createNotification(String title, String content, List<String> receiverIds, String senderId, String type, String priority, String metadata, String actionUrl) {
        List<Notification> createdNotifications = new ArrayList<>();
        for (String receiverId : receiverIds) {
            Notification notification = Notification.builder()
                    .userId(receiverId)
                    .senderId(senderId)
                    .title(title)
                    .content(content)
                    .type(type != null ? type : "SYSTEM")
                    .status("SENT")
                    .priority(priority != null ? priority : "MEDIUM")
                    .metadata(metadata)
                    .actionUrl(actionUrl)
                    .build();
            createdNotifications.add(notificationPort.save(notification));
        }
        return createdNotifications;
    }
}
