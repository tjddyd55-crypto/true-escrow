package com.trustescrow.application.service;

import com.trustescrow.domain.model.*;
import com.trustescrow.domain.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/**
 * Service for seeding demo data.
 * Creates deals in various states for demo purposes.
 * 
 * Run with: --spring.profiles.active=demo
 */
@Component
@Profile({"dev", "demo"})
@RequiredArgsConstructor
@Slf4j
public class DemoSeedService implements CommandLineRunner {
    
    private final DealApplicationService dealApplicationService;
    private final DealRepository dealRepository;
    private final ContractTemplateService contractTemplateService;
    private final TimerService timerService;
    private final EvidenceService evidenceService;
    private final DisputeCaseRepository disputeRepository;
    private final DealStateService stateService;
    private final EscrowLedgerService ledgerService;
    
    // Demo user IDs
    private static final UUID DEMO_BUYER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID DEMO_SELLER_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID DEMO_ADMIN_ID = UUID.fromString("00000000-0000-0000-0000-000000000003");
    
    @Override
    @Transactional
    public void run(String... args) {
        log.info("Starting demo seed data creation...");
        
        try {
            // Ensure templates exist
            ensureTemplatesExist();
            
            // Create deals
            UUID happyPathDealId = createUsedCarHappyPathDeal();
            UUID issueDealId = createUsedCarIssueDeal();
            UUID realEstateDealId = createRealEstateDocMismatchDeal();
            
            log.info("Demo seed data created successfully:");
            log.info("  - Used Car Happy Path: {}", happyPathDealId);
            log.info("  - Used Car Issue: {}", issueDealId);
            log.info("  - Real Estate Doc Mismatch: {}", realEstateDealId);
            log.info("View deals at:");
            log.info("  - http://localhost:3000/deals/{}", happyPathDealId);
            log.info("  - http://localhost:3000/deals/{}", issueDealId);
            log.info("  - http://localhost:3000/deals/{}", realEstateDealId);
        } catch (Exception e) {
            log.error("Failed to create demo seed data", e);
        }
    }
    
    private void ensureTemplatesExist() {
        try {
            contractTemplateService.getLatestTemplate(DealCategory.USED_CAR_PRIVATE);
        } catch (Exception e) {
            log.warn("Template for USED_CAR_PRIVATE not found, creating default...");
            // Template should be created by CategoryTemplateInitializationService
        }
        
        try {
            contractTemplateService.getLatestTemplate(DealCategory.REAL_ESTATE_SALE);
        } catch (Exception e) {
            log.warn("Template for REAL_ESTATE_SALE not found, creating default...");
        }
    }
    
    /**
     * Creates a used car deal in INSPECTION state with AUTO_APPROVE timer running.
     */
    private UUID createUsedCarHappyPathDeal() {
        log.info("Creating used car happy path deal...");
        
        // Create deal
        CreateDealRequest request = CreateDealRequest.builder()
            .buyerId(DEMO_BUYER_ID)
            .sellerId(DEMO_SELLER_ID)
            .itemRef("DEMO-UC-HAPPY-001")
            .category(DealCategory.USED_CAR_PRIVATE)
            .totalAmount(new BigDecimal("10000.00"))
            .currency("USD")
            .build();
        
        Deal deal = dealApplicationService.createDeal(request, DEMO_BUYER_ID);
        UUID dealId = deal.getId();
        
        // Fund
        dealApplicationService.fundDeal(dealId, DEMO_BUYER_ID);
        
        // Deliver (moves to INSPECTION)
        dealApplicationService.deliverDeal(dealId, DEMO_SELLER_ID);
        
        // Add evidence metadata
        EvidenceMetadata evidence = EvidenceMetadata.builder()
            .dealId(dealId)
            .uploadedBy(DEMO_SELLER_ID.toString())
            .type(EvidenceType.PHOTO)
            .uri("demo://evidence/uc-happy/exterior-1.jpg")
            .createdAt(Instant.now())
            .build();
        evidenceService.createEvidence(dealId, evidence, DEMO_SELLER_ID);
        
        evidence = EvidenceMetadata.builder()
            .dealId(dealId)
            .uploadedBy(DEMO_SELLER_ID.toString())
            .type(EvidenceType.PHOTO)
            .uri("demo://evidence/uc-happy/interior-1.jpg")
            .createdAt(Instant.now())
            .build();
        evidenceService.createEvidence(dealId, evidence, DEMO_SELLER_ID);
        
        evidence = EvidenceMetadata.builder()
            .dealId(dealId)
            .uploadedBy(DEMO_SELLER_ID.toString())
            .type(EvidenceType.PHOTO)
            .uri("demo://evidence/uc-happy/odometer-1.jpg")
            .createdAt(Instant.now())
            .build();
        evidenceService.createEvidence(dealId, evidence, DEMO_SELLER_ID);
        
        log.info("Created used car happy path deal: {} (state: INSPECTION)", dealId);
        return dealId;
    }
    
    /**
     * Creates a used car deal in ISSUE state with DISPUTE_TTL timer running.
     */
    private UUID createUsedCarIssueDeal() {
        log.info("Creating used car issue deal...");
        
        // Create deal
        CreateDealRequest request = CreateDealRequest.builder()
            .buyerId(DEMO_BUYER_ID)
            .sellerId(DEMO_SELLER_ID)
            .itemRef("DEMO-UC-ISSUE-001")
            .category(DealCategory.USED_CAR_PRIVATE)
            .totalAmount(new BigDecimal("15000.00"))
            .currency("USD")
            .build();
        
        Deal deal = dealApplicationService.createDeal(request, DEMO_BUYER_ID);
        UUID dealId = deal.getId();
        
        // Fund
        dealApplicationService.fundDeal(dealId, DEMO_BUYER_ID);
        
        // Deliver (moves to INSPECTION)
        dealApplicationService.deliverDeal(dealId, DEMO_SELLER_ID);
        
        // Add evidence metadata
        EvidenceMetadata evidence = EvidenceMetadata.builder()
            .dealId(dealId)
            .uploadedBy(DEMO_SELLER_ID.toString())
            .type(EvidenceType.PHOTO)
            .uri("demo://evidence/uc-issue/exterior-1.jpg")
            .createdAt(Instant.now())
            .build();
        evidenceService.createEvidence(dealId, evidence, DEMO_SELLER_ID);
        
        // Raise issue
        IssueRequest issueRequest = IssueRequest.builder()
            .reasonCode(IssueReasonCode.DAMAGE_MINOR)
            .freeText("Minor scratch on driver side door")
            .evidenceIds(java.util.List.of(evidence.getId()))
            .build();
        
        dealApplicationService.raiseIssue(dealId, issueRequest, DEMO_BUYER_ID);
        
        // Add damage photo as evidence
        EvidenceMetadata damageEvidence = EvidenceMetadata.builder()
            .dealId(dealId)
            .uploadedBy(DEMO_BUYER_ID.toString())
            .type(EvidenceType.PHOTO)
            .uri("demo://evidence/uc-issue/damage-scratch.jpg")
            .createdAt(Instant.now())
            .build();
        evidenceService.createEvidence(dealId, damageEvidence, DEMO_BUYER_ID);
        
        log.info("Created used car issue deal: {} (state: ISSUE)", dealId);
        return dealId;
    }
    
    /**
     * Creates a real estate deal in ISSUE state with DOCUMENT_MISMATCH.
     */
    private UUID createRealEstateDocMismatchDeal() {
        log.info("Creating real estate doc mismatch deal...");
        
        // Create deal
        CreateDealRequest request = CreateDealRequest.builder()
            .buyerId(DEMO_BUYER_ID)
            .sellerId(DEMO_SELLER_ID)
            .itemRef("DEMO-RE-DOC-001")
            .category(DealCategory.REAL_ESTATE_SALE)
            .totalAmount(new BigDecimal("500000.00"))
            .currency("USD")
            .build();
        
        Deal deal = dealApplicationService.createDeal(request, DEMO_BUYER_ID);
        UUID dealId = deal.getId();
        
        // Fund
        dealApplicationService.fundDeal(dealId, DEMO_BUYER_ID);
        
        // Deliver (moves to INSPECTION)
        dealApplicationService.deliverDeal(dealId, DEMO_SELLER_ID);
        
        // Add evidence metadata (contract)
        EvidenceMetadata evidence = EvidenceMetadata.builder()
            .dealId(dealId)
            .uploadedBy(DEMO_SELLER_ID.toString())
            .type(EvidenceType.REPORT)
            .uri("demo://evidence/re-doc/contract.pdf")
            .createdAt(Instant.now())
            .build();
        evidenceService.createEvidence(dealId, evidence, DEMO_SELLER_ID);
        
        // Raise issue with DOCUMENT_MISMATCH
        IssueRequest issueRequest = IssueRequest.builder()
            .reasonCode(IssueReasonCode.DOCUMENT_MISMATCH)
            .freeText("Contract shows different property address than agreed")
            .evidenceIds(java.util.List.of(evidence.getId()))
            .build();
        
        dealApplicationService.raiseIssue(dealId, issueRequest, DEMO_BUYER_ID);
        
        log.info("Created real estate doc mismatch deal: {} (state: ISSUE)", dealId);
        return dealId;
    }
}
