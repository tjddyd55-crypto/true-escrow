package com.trustescrow.domain.service;

import com.trustescrow.domain.model.ApprovalPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ApprovalPolicyRepository extends JpaRepository<ApprovalPolicy, UUID> {
}
