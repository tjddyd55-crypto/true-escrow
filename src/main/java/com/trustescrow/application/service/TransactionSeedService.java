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
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Seed service for creating demo transaction data.
 * Only runs in dev profile.
 */
@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class TransactionSeedService implements CommandLineRunner {
    
    private final TransactionRepository transactionRepository;
    private final TransactionMilestoneRepository milestoneRepository;
    private final MilestoneFileRepository fileRepository;
    private final ActivityLogRepository activityLogRepository;
    
    @Override
    @Transactional
    public void run(String... args) {
        if (transactionRepository.count() > 0) {
            log.info("Transactions already exist, skipping seed");
            return;
        }
        
        log.info("Creating demo transaction data...");
        
        // Fixed UUIDs for demo
        UUID buyerId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        UUID sellerId = UUID.fromString("00000000-0000-0000-0000-000000000002");
        
        // Transaction 1: Web Development Project
        Transaction t1 = createTransaction(
            "Website Redesign Project",
            buyerId,
            sellerId,
            Transaction.TransactionStatus.ACTIVE
        );
        
        createMilestones(t1.getId(), Arrays.asList(
            new MilestoneData("Design Mockups", new BigDecimal("1000.00"), 1),
            new MilestoneData("Frontend Development", new BigDecimal("2000.00"), 2),
            new MilestoneData("Backend Integration", new BigDecimal("1500.00"), 3)
        ));
        
        // Transaction 2: Logo Design
        Transaction t2 = createTransaction(
            "Company Logo Design",
            buyerId,
            sellerId,
            Transaction.TransactionStatus.ACTIVE
        );
        
        List<TransactionMilestone> t2Milestones = createMilestones(t2.getId(), Arrays.asList(
            new MilestoneData("Initial Concepts", new BigDecimal("500.00"), 1),
            new MilestoneData("Final Design", new BigDecimal("500.00"), 2)
        ));
        
        // Add a file to first milestone of t2
        if (!t2Milestones.isEmpty()) {
            createFile(t2Milestones.get(0).getId(), MilestoneFile.UploaderRole.SELLER, 
                "/uploads/logo-concept-1.pdf", "logo-concept-1.pdf");
        }
        
        // Transaction 3: Content Writing
        Transaction t3 = createTransaction(
            "Blog Content Package",
            buyerId,
            sellerId,
            Transaction.TransactionStatus.DRAFT
        );
        
        createMilestones(t3.getId(), Arrays.asList(
            new MilestoneData("Article 1-5", new BigDecimal("300.00"), 1),
            new MilestoneData("Article 6-10", new BigDecimal("300.00"), 2),
            new MilestoneData("Article 11-15", new BigDecimal("400.00"), 3)
        ));
        
        log.info("Demo transaction data created successfully");
    }
    
    private Transaction createTransaction(String title, UUID buyerId, UUID sellerId, 
                                         Transaction.TransactionStatus status) {
        Transaction transaction = Transaction.builder()
            .title(title)
            .initiatorId(buyerId)
            .initiatorRole(Transaction.InitiatorRole.BUYER)
            .buyerId(buyerId)
            .sellerId(sellerId)
            .status(status)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
        
        Transaction saved = transactionRepository.save(transaction);
        
        // Log creation
        logActivity(saved.getId(), ActivityLog.ActorRole.BUYER, "TRANSACTION_CREATED", null);
        
        return saved;
    }
    
    private List<TransactionMilestone> createMilestones(UUID transactionId, 
                                                         List<MilestoneData> milestoneData) {
        return milestoneData.stream()
            .map(data -> {
                TransactionMilestone milestone = TransactionMilestone.builder()
                    .transactionId(transactionId)
                    .title(data.title)
                    .amount(data.amount)
                    .status(TransactionMilestone.MilestoneStatus.PENDING)
                    .orderIndex(data.orderIndex)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
                return milestoneRepository.save(milestone);
            })
            .toList();
    }
    
    private MilestoneFile createFile(UUID milestoneId, MilestoneFile.UploaderRole role, 
                                     String fileUrl, String fileName) {
        MilestoneFile file = MilestoneFile.builder()
            .milestoneId(milestoneId)
            .uploaderRole(role)
            .fileUrl(fileUrl)
            .fileName(fileName)
            .fileSize(1024L * 100) // 100KB
            .mimeType("application/pdf")
            .createdAt(Instant.now())
            .build();
        return fileRepository.save(file);
    }
    
    private void logActivity(UUID transactionId, ActivityLog.ActorRole role, 
                            String action, java.util.Map<String, Object> meta) {
        ActivityLog log = ActivityLog.builder()
            .transactionId(transactionId)
            .actorRole(role)
            .action(action)
            .meta(meta)
            .createdAt(Instant.now())
            .build();
        activityLogRepository.save(log);
    }
    
    private static class MilestoneData {
        String title;
        BigDecimal amount;
        int orderIndex;
        
        MilestoneData(String title, BigDecimal amount, int orderIndex) {
            this.title = title;
            this.amount = amount;
            this.orderIndex = orderIndex;
        }
    }
}
