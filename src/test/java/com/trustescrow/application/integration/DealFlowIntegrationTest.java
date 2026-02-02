package com.trustescrow.application.integration;

import com.trustescrow.application.dto.CreateDealRequest;
import com.trustescrow.application.service.DealApplicationService;
import com.trustescrow.domain.model.*;
import com.trustescrow.domain.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DealFlowIntegrationTest {
    
    @Autowired
    private DealApplicationService dealService;
    
    @Autowired
    private DealRepository dealRepository;
    
    @Autowired
    private EscrowLedgerService ledgerService;
    
    @Autowired
    private AuditEventRepository auditEventRepository;
    
    @Test
    void testHappyPath() {
        // Create deal
        CreateDealRequest request = new CreateDealRequest();
        request.setBuyerId(UUID.randomUUID());
        request.setSellerId(UUID.randomUUID());
        request.setItemRef("ITEM-001");
        request.setCategory(DealCategory.CAR);
        request.setTotalAmount(new BigDecimal("1000"));
        request.setCurrency("USD");
        
        UUID actorId = UUID.randomUUID();
        Deal deal = dealService.createDeal(request, actorId);
        
        assertEquals(DealState.CREATED, deal.getState());
        assertEquals(new BigDecimal("700.00"), deal.getImmediateAmount());
        assertEquals(new BigDecimal("300.00"), deal.getHoldbackAmount());
        
        // Fund deal
        dealService.fundDeal(deal.getId(), actorId);
        deal = dealRepository.findById(deal.getId()).orElseThrow();
        assertEquals(DealState.FUNDED, deal.getState());
        
        // Deliver deal
        dealService.deliverDeal(deal.getId(), actorId);
        deal = dealRepository.findById(deal.getId()).orElseThrow();
        assertEquals(DealState.INSPECTION, deal.getState());
        
        // Approve deal
        dealService.approveDeal(deal.getId(), actorId);
        deal = dealRepository.findById(deal.getId()).orElseThrow();
        assertEquals(DealState.SETTLED, deal.getState());
        
        // Verify audit events
        assertFalse(auditEventRepository.findByDealIdOrderByCreatedAtAsc(deal.getId()).isEmpty());
    }
    
    @Test
    void testIssuePath() {
        // Create and fund deal
        CreateDealRequest request = new CreateDealRequest();
        request.setBuyerId(UUID.randomUUID());
        request.setSellerId(UUID.randomUUID());
        request.setItemRef("ITEM-002");
        request.setCategory(DealCategory.CAR);
        request.setTotalAmount(new BigDecimal("1000"));
        request.setCurrency("USD");
        
        UUID actorId = UUID.randomUUID();
        Deal deal = dealService.createDeal(request, actorId);
        dealService.fundDeal(deal.getId(), actorId);
        dealService.deliverDeal(deal.getId(), actorId);
        
        // Raise issue
        com.trustescrow.application.dto.IssueRequest issueRequest = new com.trustescrow.application.dto.IssueRequest();
        issueRequest.setReasonCode(IssueReasonCode.DAMAGE_MINOR);
        issueRequest.setEvidenceIds(java.util.List.of(UUID.randomUUID()));
        
        dealService.raiseIssue(deal.getId(), issueRequest, actorId);
        deal = dealRepository.findById(deal.getId()).orElseThrow();
        assertEquals(DealState.ISSUE, deal.getState());
    }
}
