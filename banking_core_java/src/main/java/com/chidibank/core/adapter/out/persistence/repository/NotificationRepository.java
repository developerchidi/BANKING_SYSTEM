package com.chidibank.core.adapter.out.persistence.repository;

import com.chidibank.core.adapter.out.persistence.entity.NotificationEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface NotificationRepository extends JpaRepository<NotificationEntity, String> {
    
    @Query("SELECT n FROM NotificationEntity n WHERE n.receiver.id = :userId ORDER BY n.createdAt DESC")
    List<NotificationEntity> findByReceiverId(@Param("userId") String userId, Pageable pageable);

    @Query("SELECT COUNT(n) FROM NotificationEntity n WHERE n.receiver.id = :userId AND n.readAt IS NULL")
    long countUnreadByReceiverId(@Param("userId") String userId);

    @Modifying
    @Query("UPDATE NotificationEntity n SET n.readAt = CURRENT_TIMESTAMP WHERE n.receiver.id = :userId AND n.readAt IS NULL")
    void markAllAsReadForUser(@Param("userId") String userId);
}
