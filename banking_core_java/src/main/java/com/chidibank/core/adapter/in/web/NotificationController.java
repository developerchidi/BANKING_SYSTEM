package com.chidibank.core.adapter.in.web;

import com.chidibank.core.application.port.in.NotificationUseCase;
import com.chidibank.core.application.port.out.UserPort;
import com.chidibank.core.domain.Notification;
import com.chidibank.core.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationUseCase notificationUseCase;
    private final UserPort userPort;

    @GetMapping
    public ResponseEntity<?> getNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        
        String userId = getCurrentUserId(authentication);
        List<Notification> notifications = notificationUseCase.getNotifications(userId, limit, offset);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                        "notifications", notifications,
                        "limit", limit,
                        "offset", offset,
                        "totalCount", notifications.size() // Simplified - in real app, query it
                )
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getNotificationById(@PathVariable String id) {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", notificationUseCase.getNotificationById(id)
        ));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id) {
        notificationUseCase.markAsRead(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Notification marked as read"));
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(Authentication authentication) {
        String userId = getCurrentUserId(authentication);
        notificationUseCase.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "All notifications marked as read"));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Authentication authentication) {
        String userId = getCurrentUserId(authentication);
        long count = notificationUseCase.getUnreadCount(userId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of("count", count)
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable String id) {
        notificationUseCase.deleteNotification(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Notification deleted"));
    }

    @PostMapping
    public ResponseEntity<?> createNotification(
            Authentication authentication,
            @RequestBody Map<String, Object> body) {
        
        String senderId = getCurrentUserId(authentication);
        String title = (String) body.get("title");
        String content = (String) body.get("content");
        List<String> receiverIds = (List<String>) body.get("receiverIds");
        String type = (String) body.get("type");
        String priority = (String) body.get("priority");
        String metadata = (String) body.get("metadata");
        String actionUrl = (String) body.get("actionUrl");

        List<Notification> created = notificationUseCase.createNotification(
                title, content, receiverIds, senderId, type, priority, metadata, actionUrl);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", created
        ));
    }

    private String getCurrentUserId(Authentication authentication) {
        String studentId = authentication.getName();
        User user = userPort.findByStudentId(studentId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}
