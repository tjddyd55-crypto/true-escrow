package com.trustescrow.application.dto;

import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class ChatMessageResponse {
    private UUID id;
    private UUID roomId;
    private UUID senderId;
    private String content;
    private String type;
    private Instant createdAt;
    private Instant readAt;
}
