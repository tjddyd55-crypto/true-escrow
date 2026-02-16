package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Chat message in a chat room.
 */
@Entity
@Table(name = "chat_messages", indexes = {
    @Index(name = "idx_chat_messages_room_created", columnList = "roomId,createdAt"),
    @Index(name = "idx_chat_messages_sender", columnList = "senderId")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ChatMessage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID roomId;
    
    @Column(nullable = false)
    private UUID senderId;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MessageType type;
    
    @Column(nullable = false)
    private Instant createdAt;
    
    private Instant readAt;
    
    public enum MessageType {
        TEXT,
        SYSTEM, // System message for status updates
        PAYMENT_REQUEST,
        MILESTONE_UPDATE
    }
    
    public void markAsRead() {
        this.readAt = Instant.now();
    }
}
