package com.trustescrow.domain.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trustescrow.domain.model.IssueReasonCode;
import com.trustescrow.domain.rules.RulesEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for parsing contract template JSON.
 * Extracts category-specific parameters without changing core logic.
 * 
 * Phase 4: Template parameters vary by category but structure remains the same.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TemplateParserService {
    
    private final ObjectMapper objectMapper;
    
    /**
     * Parses template JSON and extracts ContractTemplateData for Rules Engine.
     */
    public RulesEngine.ContractTemplateData parseTemplateData(String snapshotJson) {
        try {
            JsonNode root = objectMapper.readTree(snapshotJson);
            
            // Extract default resolution
            String defaultResolution = root.path("issuePolicy")
                .path("defaultResolutionOnDisputeTTL")
                .asText("releaseHoldbackMinusMinorCap");
            
            // Extract offset caps by reason code
            Map<IssueReasonCode, BigDecimal> offsetCaps = new HashMap<>();
            JsonNode offsetCapsNode = root.path("issuePolicy")
                .path("offsetCapsByReasonCode");
            
            if (offsetCapsNode.isObject()) {
                offsetCapsNode.fields().forEachRemaining(entry -> {
                    try {
                        IssueReasonCode reasonCode = IssueReasonCode.valueOf(entry.getKey());
                        BigDecimal cap = BigDecimal.valueOf(entry.getValue().asDouble());
                        offsetCaps.put(reasonCode, cap);
                    } catch (IllegalArgumentException e) {
                        log.warn("Unknown reason code in template: {}", entry.getKey());
                    }
                });
            }
            
            return RulesEngine.ContractTemplateData.builder()
                .defaultResolutionOnDisputeTTL(defaultResolution)
                .offsetCapsByReasonCode(offsetCaps)
                .build();
        } catch (Exception e) {
            log.error("Failed to parse template JSON, using defaults", e);
            // Fallback to defaults
            return RulesEngine.ContractTemplateData.builder()
                .defaultResolutionOnDisputeTTL("releaseHoldbackMinusMinorCap")
                .offsetCapsByReasonCode(new HashMap<>())
                .build();
        }
    }
    
    /**
     * Extracts monetary policy from template (immediate/holdback percentages).
     */
    public MonetaryPolicy extractMonetaryPolicy(String snapshotJson) {
        try {
            JsonNode root = objectMapper.readTree(snapshotJson);
            JsonNode monetaryPolicy = root.path("monetaryPolicy");
            
            int immediatePercent = monetaryPolicy.path("immediatePercent").asInt(70);
            int holdbackPercent = monetaryPolicy.path("holdbackPercent").asInt(30);
            
            return MonetaryPolicy.builder()
                .immediatePercent(immediatePercent)
                .holdbackPercent(holdbackPercent)
                .build();
        } catch (Exception e) {
            log.error("Failed to extract monetary policy, using defaults", e);
            return MonetaryPolicy.builder()
                .immediatePercent(70)
                .holdbackPercent(30)
                .build();
        }
    }
    
    /**
     * Extracts timer configuration from template.
     */
    public TimerConfiguration extractTimerConfiguration(String snapshotJson) {
        try {
            JsonNode root = objectMapper.readTree(snapshotJson);
            JsonNode timers = root.path("timers");
            
            int autoApproveDays = timers.path("AUTO_APPROVE")
                .path("durationDays")
                .asInt(7);
            
            int disputeTTLDays = timers.path("DISPUTE_TTL")
                .path("durationDays")
                .asInt(14);
            
            boolean autoApproveEnabled = timers.path("AUTO_APPROVE")
                .path("enabled")
                .asBoolean(true);
            
            return TimerConfiguration.builder()
                .autoApproveDuration(Duration.ofDays(autoApproveDays))
                .disputeTTLDuration(Duration.ofDays(disputeTTLDays))
                .autoApproveEnabled(autoApproveEnabled)
                .build();
        } catch (Exception e) {
            log.error("Failed to extract timer configuration, using defaults", e);
            return TimerConfiguration.builder()
                .autoApproveDuration(Duration.ofDays(7))
                .disputeTTLDuration(Duration.ofDays(14))
                .autoApproveEnabled(true)
                .build();
        }
    }
    
    /**
     * Checks if evidence is required for issue creation (from template).
     */
    public boolean isEvidenceRequiredForIssue(String snapshotJson) {
        try {
            JsonNode root = objectMapper.readTree(snapshotJson);
            return root.path("issuePolicy")
                .path("evidenceRequired")
                .asBoolean(true); // Default: required
        } catch (Exception e) {
            log.error("Failed to check evidence requirement, defaulting to required", e);
            return true; // Default: required
        }
    }
    
    @lombok.Value
    @lombok.Builder
    public static class MonetaryPolicy {
        int immediatePercent;
        int holdbackPercent;
    }
    
    @lombok.Value
    @lombok.Builder
    public static class TimerConfiguration {
        Duration autoApproveDuration;
        Duration disputeTTLDuration;
        boolean autoApproveEnabled;
    }
}
