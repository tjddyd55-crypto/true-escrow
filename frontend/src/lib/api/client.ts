/**
 * API Client for Trust Escrow Backend
 * Handles all API communication with typed requests/responses
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  meta?: {
    ruleVersion?: string;
    idempotencyKey?: string;
    actionsExecuted?: string[];
  };
}

export interface Deal {
  id: string;
  buyerId: string;
  sellerId: string;
  itemRef: string;
  category: string;
  totalAmount: number;
  immediateAmount: number;
  holdbackAmount: number;
  currency: string;
  state: string; // DealState canonical key
  contractInstanceId: string;
  createdAt: string;
  updatedAt: string;
  inspectionStartedAt?: string;
  issueRaisedAt?: string;
  disputeOpen?: boolean;
}

export interface Timer {
  id: string;
  dealId: string;
  timerType: string; // TimerKey canonical
  startedAt: string;
  duration: string; // ISO duration
  firedAt?: string;
  active: boolean;
}

export interface EvidenceMetadata {
  id: string;
  dealId: string;
  uploadedBy: string;
  type: 'PHOTO' | 'VIDEO' | 'REPORT';
  uri: string;
  checksum?: string;
  createdAt: string;
}

export interface EscrowLedgerEntry {
  id: string;
  dealId: string;
  type: string; // LedgerEntryType canonical
  amount: number;
  currency: string;
  fromAccount: string;
  toAccount: string;
  referenceId?: string;
  idempotencyKey: string;
  createdBy: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  dealId: string;
  type: string; // AuditEventType canonical
  actor: string;
  payload?: string;
  createdAt: string;
}

export interface TimelineItem {
  type: 'AUDIT_EVENT' | 'LEDGER_ENTRY' | 'EVIDENCE';
  timestamp: string;
  data: AuditEvent | EscrowLedgerEntry | EvidenceMetadata;
}

export interface DealTimeline {
  dealId: string;
  items: TimelineItem[];
}

export interface DisputeCase {
  id: string;
  dealId: string;
  reasonCode: string; // IssueReasonCode canonical
  freeText?: string;
  status: 'OPEN' | 'RESOLVED';
  createdAt: string;
  expiresAt: string;
  resolvedAt?: string;
  resolutionOutcome?: string;
  resolvedBy?: string;
}

export interface CreateDealRequest {
  buyerId: string;
  sellerId: string;
  itemRef: string;
  category: string;
  totalAmount: number;
  currency: string;
}

export interface IssueRequest {
  reasonCode: string; // IssueReasonCode canonical
  freeText?: string;
  evidenceIds: string[];
}

export interface ResolveDisputeRequest {
  outcome: string;
}

export interface OverrideDealRequest {
  reason: string;
  explanation: string;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generate idempotency key for mutation requests
 */
function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Make API request with error handling
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add idempotency key for mutations if not provided
  if (options.method && options.method !== 'GET' && !headers['X-Idempotency-Key']) {
    headers['X-Idempotency-Key'] = generateIdempotencyKey();
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.ok) {
      throw new ApiError(
        data.error || `HTTP ${response.status}`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0,
      error
    );
  }
}

/**
 * API Client methods
 */
export const api = {
  // Deal endpoints
  deals: {
    create: (data: CreateDealRequest): Promise<ApiResponse<Deal>> => {
      return request<Deal>('/api/deals', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    get: (id: string): Promise<ApiResponse<Deal>> => {
      return request<Deal>(`/api/deals/${id}`);
    },

    fund: (id: string): Promise<ApiResponse<void>> => {
      return request<void>(`/api/deals/${id}/fund`, {
        method: 'POST',
      });
    },

    deliver: (id: string): Promise<ApiResponse<void>> => {
      return request<void>(`/api/deals/${id}/deliver`, {
        method: 'POST',
      });
    },

    approve: (id: string): Promise<ApiResponse<void>> => {
      return request<void>(`/api/deals/${id}/approve`, {
        method: 'POST',
      });
    },

    raiseIssue: (id: string, data: IssueRequest): Promise<ApiResponse<void>> => {
      return request<void>(`/api/deals/${id}/issue`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getTimeline: (id: string): Promise<ApiResponse<DealTimeline>> => {
      return request<DealTimeline>(`/api/deals/${id}/timeline`);
    },
  },

  // Admin endpoints
  admin: {
    listDisputes: (status?: string): Promise<ApiResponse<DisputeCase[]>> => {
      const params = status ? `?status=${status}` : '';
      return request<DisputeCase[]>(`/api/admin/disputes${params}`);
    },

    resolveDispute: (
      id: string,
      data: ResolveDisputeRequest
    ): Promise<ApiResponse<void>> => {
      return request<void>(`/api/admin/disputes/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    overrideDeal: (
      id: string,
      data: OverrideDealRequest
    ): Promise<ApiResponse<void>> => {
      return request<void>(`/api/admin/deals/${id}/override`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },
};

export { ApiError };
