package com.trustescrow.domain.service;

import com.trustescrow.domain.model.EscrowLedgerEntry;
import com.trustescrow.domain.rules.RulesEngine;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@Import(EscrowLedgerService.class)
class EscrowLedgerServiceTest {
    
    @Autowired
    private EscrowLedgerService ledgerService;
    
    @Autowired
    private EscrowLedgerRepository ledgerRepository;
    
    @Test
    void testIdempotency() {
        UUID dealId = UUID.randomUUID();
        RulesEngine.EscrowAction action = RulesEngine.EscrowAction.builder()
            .type(RulesEngine.EscrowActionType.RELEASE)
            .amount(new BigDecimal("100"))
            .fromAccount("escrow")
            .toAccount("seller")
            .build();
        
        // Execute first time
        EscrowLedgerEntry entry1 = ledgerService.executeAction(dealId, action, "system");
        
        // Execute second time (should be idempotent)
        EscrowLedgerEntry entry2 = ledgerService.executeAction(dealId, action, "system");
        
        // Should return the same entry
        assertEquals(entry1.getId(), entry2.getId());
        
        // Should only have one entry in database
        assertEquals(1, ledgerRepository.findByDealIdOrderByCreatedAtAsc(dealId).size());
    }
}
