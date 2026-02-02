'use client';

import { formatCurrency, t, type DealState, type Locale } from '@/i18n';

interface Deal {
  id: string;
  state: DealState;
  totalAmount: number;
  immediateAmount: number;
  holdbackAmount: number;
  currency: string;
}

interface MoneySummaryProps {
  deal: Deal;
  locale: Locale;
}

const getMoneyStatus = (state: DealState, amountType: 'immediate' | 'holdback', locale: Locale): string => {
  if (amountType === 'immediate') {
    if (state === 'CREATED' || state === 'FUNDED') {
      return t('money.willBeReleasedAt', locale);
    }
    if (state === 'DELIVERED' || state === 'INSPECTION' || state === 'APPROVED' || state === 'SETTLED') {
      return t('money.releasedToSeller', locale);
    }
  } else {
    // holdback
    if (state === 'CREATED' || state === 'FUNDED' || state === 'DELIVERED' || state === 'INSPECTION') {
      return t('money.heldInEscrow', locale);
    }
    if (state === 'APPROVED') {
      return t('money.willBeReleasedAutomatically', locale);
    }
    if (state === 'SETTLED') {
      return t('money.releasedToSeller', locale);
    }
    if (state === 'ISSUE') {
      return t('money.mayBeOffset', locale);
    }
  }
  return '';
};

export default function MoneySummary({ deal, locale }: MoneySummaryProps) {
  const immediatePercent = Math.round((deal.immediateAmount / deal.totalAmount) * 100);
  const holdbackPercent = Math.round((deal.holdbackAmount / deal.totalAmount) * 100);

  return (
    <div style={{
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '1.5rem',
      background: '#f9f9f9'
    }}>
      <h3 style={{ marginTop: 0 }}>
        {t('ui.moneySummary', locale)}
      </h3>

      {/* Total Amount */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '0.25rem' }}>
          {t('ui.totalAmount', locale)}
        </div>
        <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
          {formatCurrency(deal.totalAmount, deal.currency, locale)}
        </div>
      </div>

      {/* Immediate Amount */}
      <div style={{ 
        marginBottom: '1rem',
        padding: '1rem',
        background: '#fff',
        borderRadius: '4px',
        border: '1px solid #ddd'
      }}>
        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '0.25rem' }}>
          {t('ui.immediateAmount', locale)} ({immediatePercent}%)
        </div>
        <div style={{ fontSize: '1.2em', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          {formatCurrency(deal.immediateAmount, deal.currency, locale)}
        </div>
        <div style={{ fontSize: '0.85em', color: '#666' }}>
          {getMoneyStatus(deal.state, 'immediate', locale)}
        </div>
      </div>

      {/* Holdback Amount */}
      <div style={{ 
        padding: '1rem',
        background: '#fff',
        borderRadius: '4px',
        border: '1px solid #ddd'
      }}>
        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '0.25rem' }}>
          {t('ui.holdbackAmount', locale)} ({holdbackPercent}%)
        </div>
        <div style={{ fontSize: '1.2em', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          {formatCurrency(deal.holdbackAmount, deal.currency, locale)}
        </div>
        <div style={{ fontSize: '0.85em', color: '#666' }}>
          {getMoneyStatus(deal.state, 'holdback', locale)}
        </div>
      </div>

      {/* Timeline Link */}
      <div style={{ marginTop: '1rem', fontSize: '0.9em' }}>
        <a href={`/deals/${deal.id}/timeline`} style={{ color: '#0070f3' }}>
          {t('actions.viewTimeline', locale)} →
        </a>
      </div>
    </div>
  );
}
