package com.trustescrow.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Chat room for escrow deals.
 * Chat is for status display, Escrow is separate domain.
 */
@Entity
@Table(name = "chat_rooms", indexes = {
    @Index(name = "idx_chat_rooms_deal", columnList = "dealId"),
    @Index(name = "idx_chat_rooms_participants", columnList = "buyerId,sellerId")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ChatRoom {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID dealId;
    
    @Column(nullable = false)
    private UUID buyerId;
    
    @Column(nullable = false)
    private UUID sellerId;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ChatRoomStatus status;
    
    @Column(nullable = false)
    private Instant createdAt;
    
    @Column(nullable = false)
    private Instant updatedAt;
    
    private Instant lastMessageAt;
    
    public enum ChatRoomStatus {
        ACTIVE,
        ARCHIVED,
        CLOSED
    }
    
    public void updateStatus(ChatRoomStatus newStatus) {
        this.status = newStatus;
        this.updatedAt = Instant.now();
    }
    
    public void markLastMessage() {
        this.lastMessageAt = Instant.now();
        this.updatedAt = Instant.now();
    }
}
