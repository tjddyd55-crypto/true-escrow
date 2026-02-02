'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Timeline from '@/components/deal/Timeline';
import ActionsPanel from '@/components/deal/ActionsPanel';
import EvidencePanel from '@/components/deal/EvidencePanel';
import MoneySummary from '@/components/deal/MoneySummary';
import { useDeal, useDealTimeline } from '@/lib/api/hooks';
import { getLocale, type Role } from '@/i18n';

export default function DealDetailPage() {
  const params = useParams();
  const dealId = params.id as string;
  const { deal, loading, error, refetch } = useDeal(dealId);
  const { timeline } = useDealTimeline(dealId);
  const [currentUserRole, setCurrentUserRole] = useState<Role>('BUYER'); // Mock - will come from auth
  const locale = getLocale();

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        Error: {error.message}
        <button onClick={() => refetch()} style={{ marginLeft: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  if (!deal) {
    return <div style={{ padding: '2rem' }}>Deal not found</div>;
  }

  return (
    <div style={{ 
      padding: '2rem', 
      fontFamily: 'system-ui',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      <h1>Deal #{deal.id}</h1>
      
      {/* 4 Pillars Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
        marginTop: '2rem'
      }}>
        {/* Timeline - Left/Top */}
        <div style={{ gridColumn: '1 / -1' }}>
          <Timeline 
            currentState={deal.state as any}
            disputeOpen={deal.disputeOpen}
            timers={[]} // Will be populated from timeline data
            locale={locale}
            timeline={timeline}
          />
        </div>

        {/* Actions Panel - Top Right */}
        <div>
          <ActionsPanel
            deal={deal}
            userRole={currentUserRole}
            locale={locale}
          />
        </div>

        {/* Evidence Panel - Bottom Left */}
        <div>
          <EvidencePanel
            dealId={deal.id}
            locale={locale}
            onEvidenceAdded={() => {
              // Refetch timeline to show new evidence
              window.location.reload();
            }}
          />
        </div>

        {/* Money Summary - Bottom Right */}
        <div>
          <MoneySummary
            deal={deal}
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}
