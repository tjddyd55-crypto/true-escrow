package com.trustescrow.domain.model;

public enum AuditEventType {
    STATE_TRANSITION,
    RULES_EVALUATION,
    LEDGER_ACTION_EXECUTED,
    DISPUTE_OPENED,
    DISPUTE_UPDATED,
    DISPUTE_RESOLVED,
    ADMIN_OVERRIDE,
    // STEP 4: Escrow release approval events
    RELEASE_REQUESTED,   // Release request submitted by buyer/seller
    RELEASE_APPROVED,    // Release approved by admin
    RELEASE_REJECTED     // Release rejected by admin
}
