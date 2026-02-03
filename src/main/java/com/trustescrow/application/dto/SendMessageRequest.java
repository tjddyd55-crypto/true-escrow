package com.trustescrow.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class SendMessageRequest {
    
    @NotBlank
    private String content;
    
    private UUID senderId; // Optional, can use X-User-Id header instead
}
