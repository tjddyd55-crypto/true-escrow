package com.trustescrow.application.service;

import com.trustescrow.domain.model.*;
import com.trustescrow.domain.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service for building and managing transactions with Block/WorkRule architecture.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionBuilderService {
    
    private final TransactionRepository transactionRepository;
    private final BlockRepository blockRepository;
    private final WorkRuleRepository workRuleRepository;
    private final WorkItemRepository workItemRepository;
    private final ApprovalPolicyRepository approvalPolicyRepository;
    private final BlockApproverRepository blockApproverRepository;
    
    @Transactional
    public Transaction createTransaction(String title, String description, UUID initiatorId, 
                                        Transaction.InitiatorRole initiatorRole, UUID buyerId, UUID sellerId) {
        Transaction transaction = Transaction.builder()
            .title(title)
            .description(description)
            .initiatorId(initiatorId)
            .initiatorRole(initiatorRole)
            .buyerId(buyerId)
            .sellerId(sellerId)
            .status(Transaction.TransactionStatus.DRAFT)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
        
        return transactionRepository.save(transaction);
    }
    
    @Transactional
    public Block createBlock(UUID transactionId, String title, Integer startDay, Integer endDay, 
                            Integer orderIndex, ApprovalPolicy.ApprovalType approvalType, Integer threshold) {
        // Create approval policy
        ApprovalPolicy policy = ApprovalPolicy.builder()
            .type(approvalType)
            .threshold(threshold)
            .createdAt(Instant.now())
            .build();
        ApprovalPolicy savedPolicy = approvalPolicyRepository.save(policy);
        
        // Create block
        Block block = Block.builder()
            .transactionId(transactionId)
            .title(title)
            .startDay(startDay)
            .endDay(endDay)
            .orderIndex(orderIndex)
            .approvalPolicyId(savedPolicy.getId())
            .isActive(false) // First block becomes active when transaction is activated
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
        
        return blockRepository.save(block);
    }
    
    @Transactional
    public BlockApprover addApprover(UUID blockId, BlockApprover.ApproverRole role, UUID userId, Boolean required) {
        BlockApprover approver = BlockApprover.builder()
            .blockId(blockId)
            .role(role)
            .userId(userId)
            .required(required != null ? required : true)
            .createdAt(Instant.now())
            .build();
        
        return blockApproverRepository.save(approver);
    }
    
    @Transactional
    public WorkRule createWorkRule(UUID blockId, WorkRule.WorkType workType, String description, 
                                   Integer quantity, WorkRule.Frequency frequency, List<Integer> dueDates) {
        WorkRule workRule = WorkRule.builder()
            .blockId(blockId)
            .workType(workType)
            .description(description)
            .quantity(quantity != null ? quantity : 1)
            .frequency(frequency)
            .dueDates(dueDates)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
        
        return workRuleRepository.save(workRule);
    }
    
    @Transactional
    public void activateTransaction(UUID transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
            .orElseThrow(() -> new RuntimeException("Transaction not found"));
        
        if (transaction.getStatus() != Transaction.TransactionStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT transactions can be activated");
        }
        
        transaction.updateStatus(Transaction.TransactionStatus.ACTIVE);
        transactionRepository.save(transaction);
        
        // Activate first block and generate work items
        List<Block> blocks = blockRepository.findByTransactionIdOrderByOrderIndexAsc(transactionId);
        if (!blocks.isEmpty()) {
            Block firstBlock = blocks.get(0);
            firstBlock.activate();
            blockRepository.save(firstBlock);
            
            // Generate work items for first block
            generateWorkItemsForBlock(firstBlock.getId());
        }
    }
    
    @Transactional
    public void generateWorkItemsForBlock(UUID blockId) {
        Block block = blockRepository.findById(blockId)
            .orElseThrow(() -> new RuntimeException("Block not found"));
        
        List<WorkRule> workRules = workRuleRepository.findByBlockId(blockId);
        
        for (WorkRule rule : workRules) {
            List<Integer> dueDates = calculateDueDates(rule, block);
            
            for (Integer dueDate : dueDates) {
                WorkItem workItem = WorkItem.builder()
                    .workRuleId(rule.getId())
                    .dueDate(dueDate)
                    .status(WorkItem.WorkItemStatus.PENDING)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
                workItemRepository.save(workItem);
            }
        }
    }
    
    private List<Integer> calculateDueDates(WorkRule rule, Block block) {
        List<Integer> dueDates = new ArrayList<>();
        
        if (rule.getDueDates() != null && !rule.getDueDates().isEmpty()) {
            // Use custom due dates
            dueDates.addAll(rule.getDueDates());
        } else {
            // Calculate based on frequency
            switch (rule.getFrequency()) {
                case ONCE:
                    dueDates.add(block.getEndDay());
                    break;
                case DAILY:
                    for (int day = block.getStartDay(); day <= block.getEndDay(); day++) {
                        dueDates.add(day);
                    }
                    break;
                case WEEKLY:
                    for (int day = block.getStartDay(); day <= block.getEndDay(); day += 7) {
                        dueDates.add(day);
                    }
                    break;
                case CUSTOM:
                    // Default to end day if custom but no dates specified
                    dueDates.add(block.getEndDay());
                    break;
            }
        }
        
        // Limit to quantity
        if (rule.getQuantity() > 0 && dueDates.size() > rule.getQuantity()) {
            dueDates = dueDates.subList(0, rule.getQuantity());
        }
        
        return dueDates;
    }
    
    public List<Block> getBlocks(UUID transactionId) {
        return blockRepository.findByTransactionIdOrderByOrderIndexAsc(transactionId);
    }
    
    public List<WorkRule> getWorkRules(UUID blockId) {
        return workRuleRepository.findByBlockId(blockId);
    }
    
    public List<WorkItem> getWorkItems(UUID workRuleId) {
        return workItemRepository.findByWorkRuleId(workRuleId);
    }
}
