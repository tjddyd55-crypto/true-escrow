'use client';

import { useParams } from 'next/navigation';
import { useDealTimeline } from '@/lib/api/hooks';
import { getLocalizedLabel, formatCurrency, type Locale } from '@/i18n';
import { getLocale } from '@/i18n/loader';

export default function TimelinePage() {
  const params = useParams();
  const dealId = params.id as string;
  const { timeline, loading, error } = useDealTimeline(dealId);
  const locale = getLocale();

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading timeline...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        Error: {error.message}
      </div>
    );
  }

  if (!timeline || timeline.items.length === 0) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Timeline</h1>
        <p>No timeline events yet.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Deal Timeline - #{dealId}</h1>
      
      <div style={{ marginTop: '2rem' }}>
        {timeline.items.map((item, index) => (
          <div
            key={index}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
              background: '#f9f9f9'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.8em', color: '#666' }}>
                {item.type}
              </div>
              <div style={{ fontSize: '0.8em', color: '#666' }}>
                {new Date(item.timestamp).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US')}
              </div>
            </div>

            {item.type === 'AUDIT_EVENT' && (
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  {item.data.type}
                </div>
                <div style={{ fontSize: '0.9em', marginTop: '0.25rem' }}>
                  Actor: {item.data.actor}
                </div>
                {item.data.payload && (
                  <div style={{ fontSize: '0.85em', color: '#666', marginTop: '0.5rem' }}>
                    {item.data.payload}
                  </div>
                )}
              </div>
            )}

            {item.type === 'LEDGER_ENTRY' && (
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  {getLocalizedLabel(item.data.type, 'ledgerTypes', locale)}
                </div>
                <div style={{ fontSize: '0.9em', marginTop: '0.25rem' }}>
                  {formatCurrency(item.data.amount, item.data.currency, locale)}
                </div>
                <div style={{ fontSize: '0.85em', color: '#666', marginTop: '0.25rem' }}>
                  {item.data.fromAccount} → {item.data.toAccount}
                </div>
                {item.data.referenceId && (
                  <div style={{ fontSize: '0.8em', color: '#666', marginTop: '0.25rem' }}>
                    Reference: {item.data.referenceId}
                  </div>
                )}
              </div>
            )}

            {item.type === 'EVIDENCE' && (
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  Evidence: {item.data.type}
                </div>
                <div style={{ fontSize: '0.9em', marginTop: '0.25rem' }}>
                  URI: {item.data.uri}
                </div>
                <div style={{ fontSize: '0.85em', color: '#666', marginTop: '0.25rem' }}>
                  Uploaded by: {item.data.uploadedBy}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
