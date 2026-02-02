'use client';

import { getLocalizedLabel, t, type DealState, type Role, type Locale } from '@/i18n';
import { useDealMutation } from '@/lib/api/hooks';
import { api } from '@/lib/api/client';
import { logDealMutation } from '@/lib/error-handling';

interface Deal {
  id: string;
  state: DealState;
  buyerId: string;
  sellerId: string;
}

interface ActionsPanelProps {
  deal: Deal;
  userRole: Role;
  locale: Locale;
}

// Action matrix from FRONTEND_INTEGRATION_CONTRACT.md
const getAllowedActions = (state: DealState, role: Role): string[] => {
  const actionMatrix: Record<DealState, Record<Role, string[]>> = {
    CREATED: {
      BUYER: ['fundDeal'],
      SELLER: [],
      OPERATOR: [],
      INSPECTOR: [],
    },
    FUNDED: {
      BUYER: [],
      SELLER: ['markDelivered'],
      OPERATOR: [],
      INSPECTOR: [],
    },
    DELIVERED: {
      BUYER: [],
      SELLER: ['uploadEvidence'], // optional
      OPERATOR: [],
      INSPECTOR: [],
    },
    INSPECTION: {
      BUYER: ['approve', 'raiseIssue'],
      SELLER: [],
      OPERATOR: [],
      INSPECTOR: [],
    },
    APPROVED: {
      BUYER: [],
      SELLER: [],
      OPERATOR: [],
      INSPECTOR: [],
    },
    ISSUE: {
      BUYER: ['uploadEvidence', 'viewTimeline'],
      SELLER: [],
      OPERATOR: ['resolveDispute'],
      INSPECTOR: [],
    },
    SETTLED: {
      BUYER: [],
      SELLER: [],
      OPERATOR: [],
      INSPECTOR: [],
    },
  };

  return actionMatrix[state]?.[role] || [];
};

export default function ActionsPanel({ deal, userRole, locale }: ActionsPanelProps) {
  const allowedActions = getAllowedActions(deal.state as DealState, userRole);
  const { mutate, loading, error } = useDealMutation();

  const handleAction = async (action: string) => {
    try {
      switch (action) {
        case 'fundDeal':
          await mutate(
            () => api.deals.fund(deal.id),
            () => {
              logDealMutation(deal.id, 'fund', true);
              window.location.reload();
            },
            (error) => {
              logDealMutation(deal.id, 'fund', false, error);
            }
          );
          break;
        case 'markDelivered':
          await mutate(
            () => api.deals.deliver(deal.id),
            () => {
              logDealMutation(deal.id, 'deliver', true);
              window.location.reload();
            },
            (error) => {
              logDealMutation(deal.id, 'deliver', false, error);
            }
          );
          break;
        case 'approve':
          await mutate(
            () => api.deals.approve(deal.id),
            () => {
              logDealMutation(deal.id, 'approve', true);
              window.location.reload();
            },
            (error) => {
              logDealMutation(deal.id, 'approve', false, error);
            }
          );
          break;
        case 'raiseIssue':
          // Will open RaiseIssueForm modal/dialog
          // For now, navigate to issue form page
          window.location.href = `/deals/${deal.id}/raise-issue`;
          break;
        default:
          console.warn(`Unknown action: ${action}`);
      }
    } catch (err) {
      console.error('Action failed:', err);
      alert(`Action failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (allowedActions.length === 0) {
    return (
      <div style={{
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '1.5rem',
        background: '#f9f9f9'
      }}>
        <h3 style={{ marginTop: 0 }}>
          {locale === 'ko' ? '액션' : 'Actions'}
        </h3>
        <p style={{ color: '#666' }}>
          {t('ui.noActionsAvailable', locale)}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '1.5rem',
      background: '#f9f9f9'
    }}>
      <h3 style={{ marginTop: 0 }}>
        {locale === 'ko' ? '액션' : 'Actions'}
        <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '0.5rem' }}>
          ({userRole})
        </span>
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {allowedActions.map((action) => (
          <button
            key={action}
            onClick={() => handleAction(action)}
            disabled={loading}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid #0070f3',
              borderRadius: '4px',
              background: loading ? '#ccc' : '#0070f3',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1em',
              opacity: loading ? 0.6 : 1
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#0051cc';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#0070f3';
              }
            }}
          >
            {loading ? (locale === 'ko' ? '처리 중...' : 'Processing...') : t(`actions.${action}`, locale)}
          </button>
        ))}
        {error && (
          <div style={{ marginTop: '0.5rem', color: 'red', fontSize: '0.9em' }}>
            {error.message}
          </div>
        )}
      </div>

      {/* Show canonical state for debugging */}
      <div style={{ 
        marginTop: '1rem', 
        padding: '0.5rem', 
        background: '#fff', 
        borderRadius: '4px',
        fontSize: '0.8em',
        color: '#666'
      }}>
        <strong>State:</strong> {deal.state}
      </div>
    </div>
  );
}
