package com.trustescrow.domain.model;

public enum AuditEventType {
    STATE_TRANSITION,
    RULES_EVALUATION,
    LEDGER_ACTION_EXECUTED,
    DISPUTE_OPENED,
    DISPUTE_UPDATED,
    DISPUTE_RESOLVED,
    ADMIN_OVERRIDE
}
