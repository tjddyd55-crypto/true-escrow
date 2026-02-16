package com.trustescrow.domain.service;

import com.trustescrow.domain.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    
    List<ChatMessage> findByRoomIdOrderByCreatedAtAsc(UUID roomId);
    
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.roomId = :roomId ORDER BY cm.createdAt DESC")
    List<ChatMessage> findByRoomIdOrderByCreatedAtDesc(@Param("roomId") UUID roomId);
    
    @Query("SELECT COUNT(cm) FROM ChatMessage cm WHERE cm.roomId = :roomId AND cm.readAt IS NULL AND cm.senderId != :userId")
    long countUnreadMessages(@Param("roomId") UUID roomId, @Param("userId") UUID userId);
}
