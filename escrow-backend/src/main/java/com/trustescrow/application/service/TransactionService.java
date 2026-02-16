package com.trustescrow.application.service;

import com.trustescrow.domain.model.*;
import com.trustescrow.domain.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {
    
    private final TransactionRepository transactionRepository;
    private final TransactionMilestoneRepository milestoneRepository;
    private final MilestoneFileRepository fileRepository;
    private final ActivityLogRepository activityLogRepository;
    
    public List<Transaction> getTransactionsByBuyer(UUID buyerId) {
        return transactionRepository.findByBuyerId(buyerId);
    }
    
    public List<Transaction> getTransactionsBySeller(UUID sellerId) {
        return transactionRepository.findBySellerId(sellerId);
    }
    
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }
    
    public Optional<Transaction> getTransaction(UUID id) {
        return transactionRepository.findById(id);
    }
    
    @Transactional
    public Transaction updateTransactionStatus(UUID id, Transaction.TransactionStatus status) {
        Transaction transaction = transactionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Transaction not found"));
        transaction.updateStatus(status);
        return transactionRepository.save(transaction);
    }
    
    public List<TransactionMilestone> getMilestones(UUID transactionId) {
        return milestoneRepository.findByTransactionIdOrderByOrderIndexAsc(transactionId);
    }
    
    @Transactional
    public TransactionMilestone submitMilestone(UUID milestoneId) {
        TransactionMilestone milestone = milestoneRepository.findById(milestoneId)
            .orElseThrow(() -> new RuntimeException("Milestone not found"));
        milestone.updateStatus(TransactionMilestone.MilestoneStatus.SUBMITTED);
        TransactionMilestone saved = milestoneRepository.save(milestone);
        
        // Log activity
        logActivity(milestone.getTransactionId(), ActivityLog.ActorRole.SELLER, 
            "MILESTONE_SUBMITTED", Map.of("milestoneId", milestoneId.toString()));
        
        return saved;
    }
    
    @Transactional
    public TransactionMilestone approveMilestone(UUID milestoneId) {
        TransactionMilestone milestone = milestoneRepository.findById(milestoneId)
            .orElseThrow(() -> new RuntimeException("Milestone not found"));
        milestone.updateStatus(TransactionMilestone.MilestoneStatus.APPROVED);
        TransactionMilestone saved = milestoneRepository.save(milestone);
        
        // Log activity
        logActivity(milestone.getTransactionId(), ActivityLog.ActorRole.BUYER, 
            "MILESTONE_APPROVED", Map.of("milestoneId", milestoneId.toString()));
        
        return saved;
    }
    
    public List<MilestoneFile> getFiles(UUID milestoneId) {
        return fileRepository.findByMilestoneId(milestoneId);
    }
    
    @Transactional
    public MilestoneFile saveFile(UUID milestoneId, String fileUrl, String fileName, 
                                   Long fileSize, String mimeType, MilestoneFile.UploaderRole role) {
        MilestoneFile file = MilestoneFile.builder()
            .milestoneId(milestoneId)
            .fileUrl(fileUrl)
            .fileName(fileName)
            .fileSize(fileSize)
            .mimeType(mimeType)
            .uploaderRole(role)
            .createdAt(Instant.now())
            .build();
        
        MilestoneFile saved = fileRepository.save(file);
        
        // Log activity
        TransactionMilestone milestone = milestoneRepository.findById(milestoneId)
            .orElseThrow(() -> new RuntimeException("Milestone not found"));
        logActivity(milestone.getTransactionId(), 
            role == MilestoneFile.UploaderRole.BUYER ? ActivityLog.ActorRole.BUYER : ActivityLog.ActorRole.SELLER,
            "FILE_UPLOADED", Map.of("fileId", saved.getId().toString(), "milestoneId", milestoneId.toString()));
        
        return saved;
    }
    
    public List<ActivityLog> getActivityLogs(UUID transactionId) {
        return activityLogRepository.findByTransactionIdOrderByCreatedAtDesc(transactionId);
    }
    
    private void logActivity(UUID transactionId, ActivityLog.ActorRole actorRole, 
                           String action, Map<String, Object> meta) {
        ActivityLog log = ActivityLog.builder()
            .transactionId(transactionId)
            .actorRole(actorRole)
            .action(action)
            .meta(meta)
            .createdAt(Instant.now())
            .build();
        activityLogRepository.save(log);
    }
}
