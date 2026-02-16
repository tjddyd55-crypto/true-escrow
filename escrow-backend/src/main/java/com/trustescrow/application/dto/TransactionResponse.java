package com.trustescrow.application.dto;

import com.trustescrow.domain.model.Transaction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private UUID id;
    private String title;
    private UUID buyerId;
    private UUID sellerId;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
    private List<MilestoneResponse> milestones;
    private List<ActivityLogResponse> activityLogs;
    
    public static TransactionResponse from(Transaction transaction) {
        return TransactionResponse.builder()
            .id(transaction.getId())
            .title(transaction.getTitle())
            .buyerId(transaction.getBuyerId())
            .sellerId(transaction.getSellerId())
            .status(transaction.getStatus().name())
            .createdAt(transaction.getCreatedAt())
            .updatedAt(transaction.getUpdatedAt())
            .build();
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MilestoneResponse {
        private UUID id;
        private String title;
        private String amount;
        private String status;
        private Integer orderIndex;
        private List<FileResponse> files;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FileResponse {
        private UUID id;
        private String fileName;
        private String fileUrl;
        private String uploaderRole;
        private Instant createdAt;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityLogResponse {
        private UUID id;
        private String actorRole;
        private String action;
        private Object meta;
        private Instant createdAt;
    }
}
