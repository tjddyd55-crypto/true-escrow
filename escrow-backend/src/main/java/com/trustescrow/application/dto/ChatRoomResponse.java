package com.trustescrow.application.dto;

import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class ChatRoomResponse {
    private UUID id;
    private UUID dealId;
    private UUID buyerId;
    private UUID sellerId;
    private String status;
    private Instant createdAt;
    private Instant lastMessageAt;
    private long unreadCount;
}
