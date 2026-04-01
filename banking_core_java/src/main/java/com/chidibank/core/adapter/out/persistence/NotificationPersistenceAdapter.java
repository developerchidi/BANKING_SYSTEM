package com.chidibank.core.adapter.out.persistence;

import com.chidibank.core.adapter.out.persistence.entity.NotificationEntity;
import com.chidibank.core.adapter.out.persistence.entity.UserEntity;
import com.chidibank.core.adapter.out.persistence.repository.NotificationRepository;
import com.chidibank.core.adapter.out.persistence.repository.UserRepository;
import com.chidibank.core.application.port.out.NotificationPort;
import com.chidibank.core.domain.Notification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class NotificationPersistenceAdapter implements NotificationPort {

    private final NotificationRepository repository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Notification save(Notification notification) {
        UserEntity receiver = userRepository.findById(notification.getUserId())
                .orElseThrow(() -> new RuntimeException("Receiver not found"));
        
        UserEntity sender = null;
        if (notification.getSenderId() != null) {
            sender = userRepository.findById(notification.getSenderId()).orElse(null);
        }

        NotificationEntity entity = NotificationEntity.builder()
                .id(notification.getId())
                .receiver(receiver)
                .sender(sender)
                .title(notification.getTitle())
                .content(notification.getContent())
                .type(notification.getType() != null ? notification.getType() : "SYSTEM")
                .status(notification.getStatus() != null ? notification.getStatus() : "SENT")
                .priority(notification.getPriority() != null ? notification.getPriority() : "MEDIUM")
                .metadata(notification.getMetadata())
                .actionUrl(notification.getActionUrl())
                .readAt(notification.getReadAt())
                .build();

        NotificationEntity saved = repository.save(entity);
        return mapToDomain(saved);
    }

    @Override
    public Optional<Notification> findById(String id) {
        return repository.findById(id).map(this::mapToDomain);
    }

    @Override
    public List<Notification> findByUserId(String userId, int limit, int offset) {
        return repository.findByReceiverId(userId, PageRequest.of(offset / limit, limit))
                .stream()
                .map(this::mapToDomain)
                .collect(Collectors.toList());
    }

    @Override
    public long countUnreadByUserId(String userId) {
        return repository.countUnreadByReceiverId(userId);
    }

    @Override
    @Transactional
    public void markAsRead(String id) {
        repository.findById(id).ifPresent(n -> {
            n.setReadAt(LocalDateTime.now());
            n.setStatus("READ");
            repository.save(n);
        });
    }

    @Override
    @Transactional
    public void markAllAsRead(String userId) {
        repository.markAllAsReadForUser(userId);
    }

    @Override
    @Transactional
    public void delete(String id) {
        repository.deleteById(id);
    }

    private Notification mapToDomain(NotificationEntity entity) {
        return Notification.builder()
                .id(entity.getId())
                .userId(entity.getReceiver().getId())
                .senderId(entity.getSender() != null ? entity.getSender().getId() : null)
                .title(entity.getTitle())
                .content(entity.getContent())
                .type(entity.getType())
                .status(entity.getStatus())
                .priority(entity.getPriority())
                .metadata(entity.getMetadata())
                .actionUrl(entity.getActionUrl())
                .readAt(entity.getReadAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
