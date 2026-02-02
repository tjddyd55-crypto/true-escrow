package com.trustescrow.domain.service;

import com.trustescrow.domain.model.AuditEvent;
import com.trustescrow.domain.model.EscrowLedgerEntry;
import com.trustescrow.domain.model.EvidenceMetadata;
import lombok.Builder;
import lombok.Value;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * Service for reconstructing deal timeline.
 * Combines audit events, ledger entries, and evidence metadata.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TimelineService {
    
    private final AuditEventRepository auditEventRepository;
    private final EscrowLedgerRepository ledgerRepository;
    private final EvidenceRepository evidenceRepository;
    
    /**
     * Reconstructs the complete timeline for a deal.
     * Returns all events in chronological order.
     */
    @Transactional(readOnly = true)
    public DealTimeline getTimeline(UUID dealId) {
        List<AuditEvent> auditEvents = auditEventRepository.findByDealIdOrderByCreatedAtAsc(dealId);
        List<EscrowLedgerEntry> ledgerEntries = ledgerRepository.findByDealIdOrderByCreatedAtAsc(dealId);
        List<EvidenceMetadata> evidence = evidenceRepository.findByDealId(dealId);
        
        // Combine all timeline items
        List<TimelineItem> items = new ArrayList<>();
        
        for (AuditEvent event : auditEvents) {
            items.add(TimelineItem.builder()
                .type(TimelineItemType.AUDIT_EVENT)
                .timestamp(event.getCreatedAt())
                .data(event)
                .build());
        }
        
        for (EscrowLedgerEntry entry : ledgerEntries) {
            items.add(TimelineItem.builder()
                .type(TimelineItemType.LEDGER_ENTRY)
                .timestamp(entry.getCreatedAt())
                .data(entry)
                .build());
        }
        
        for (EvidenceMetadata ev : evidence) {
            items.add(TimelineItem.builder()
                .type(TimelineItemType.EVIDENCE)
                .timestamp(ev.getCreatedAt())
                .data(ev)
                .build());
        }
        
        // Sort by timestamp
        items.sort(Comparator.comparing(TimelineItem::getTimestamp));
        
        return DealTimeline.builder()
            .dealId(dealId)
            .items(items)
            .build();
    }
    
    @Value
    @Builder
    public static class DealTimeline {
        UUID dealId;
        List<TimelineItem> items;
    }
    
    @Value
    @Builder
    public static class TimelineItem {
        TimelineItemType type;
        java.time.Instant timestamp;
        Object data; // AuditEvent, EscrowLedgerEntry, or EvidenceMetadata
    }
    
    public enum TimelineItemType {
        AUDIT_EVENT,
        LEDGER_ENTRY,
        EVIDENCE
    }
}
