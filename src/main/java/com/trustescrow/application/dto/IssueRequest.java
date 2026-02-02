package com.trustescrow.application.dto;

import com.trustescrow.domain.model.IssueReasonCode;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class IssueRequest {
    @NotNull
    private IssueReasonCode reasonCode;
    
    private String freeText; // required if reasonCode is OTHER
    
    @NotNull
    private List<UUID> evidenceIds; // at least one required unless template waives
}
