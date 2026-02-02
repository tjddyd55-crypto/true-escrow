'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, type DisputeCase } from '@/lib/api/client';
import { useDealMutation, useDealTimeline } from '@/lib/api/hooks';
import { getLocale } from '@/i18n/loader';
import { t } from '@/i18n/loader';

// Allowed resolutions from contract (constrained)
const ALLOWED_RESOLUTIONS = [
  'releaseHoldbackMinusMinorCap',
  'fullRefund',
  'partialRefund',
  'releaseHoldback',
];

export default function ResolveDisputePage() {
  const params = useParams();
  const router = useRouter();
  const disputeId = params.id as string;
  const locale = getLocale();
  
  const [dispute, setDispute] = useState<DisputeCase | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<string>('');
  const [auditReason, setAuditReason] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { timeline } = useDealTimeline(dispute?.dealId || null);
  const { mutate, loading, error } = useDealMutation();

  useEffect(() => {
    // Fetch dispute details
    // In real implementation, we'd have a GET /api/admin/disputes/:id endpoint
    // For now, we'll use the list endpoint
    api.admin.listDisputes().then(response => {
      if (response.data) {
        const found = response.data.find(d => d.id === disputeId);
        if (found) {
          setDispute(found);
        }
      }
    }).catch(err => {
      console.error('Failed to fetch dispute:', err);
    });
  }, [disputeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOutcome || !auditReason.trim()) {
      alert(locale === 'ko'
        ? '해결책과 감사 사유를 모두 입력하세요.'
        : 'Please provide both outcome and audit reason.'
      );
      return;
    }

    if (!dispute) {
      alert(locale === 'ko' ? '분쟁을 찾을 수 없습니다.' : 'Dispute not found.');
      return;
    }

    try {
      await mutate(
        () => api.admin.resolveDispute(disputeId, { outcome: selectedOutcome }),
        () => {
          router.push('/admin/disputes');
        }
      );
    } catch (err) {
      console.error('Failed to resolve dispute:', err);
    }
  };

  if (!dispute) {
    return <div style={{ padding: '2rem' }}>Loading dispute...</div>;
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>{locale === 'ko' ? '분쟁 해결' : 'Resolve Dispute'}</h1>

      {/* Dispute Info */}
      <div style={{
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem',
        background: '#f9f9f9'
      }}>
        <h3 style={{ marginTop: 0 }}>Dispute #{dispute.id}</h3>
        <div style={{ marginBottom: '0.5rem' }}>
          <strong>{locale === 'ko' ? '거래 ID:' : 'Deal ID:'}</strong> {dispute.dealId}
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <strong>{locale === 'ko' ? '사유 코드:' : 'Reason Code:'}</strong> {dispute.reasonCode}
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <strong>{locale === 'ko' ? 'TTL 만료:' : 'TTL Expires:'}</strong>{' '}
          {new Date(dispute.expiresAt).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US')}
        </div>
        {dispute.freeText && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff', borderRadius: '4px' }}>
            <strong>{locale === 'ko' ? '자유 텍스트:' : 'Free Text:'}</strong>
            <div style={{ marginTop: '0.5rem' }}>{dispute.freeText}</div>
          </div>
        )}
      </div>

      {/* Timeline */}
      {timeline && (
        <div style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
          background: '#f9f9f9'
        }}>
          <h3 style={{ marginTop: 0 }}>{locale === 'ko' ? '타임라인' : 'Timeline'}</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {timeline.items.slice(-10).map((item, index) => (
              <div key={index} style={{ 
                padding: '0.5rem', 
                borderBottom: '1px solid #eee',
                fontSize: '0.9em'
              }}>
                <div style={{ color: '#666' }}>
                  {new Date(item.timestamp).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US')}
                </div>
                <div>{item.type}: {JSON.stringify(item.data).substring(0, 100)}...</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolution Form */}
      <form onSubmit={handleSubmit} style={{
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '1.5rem',
        background: '#fff'
      }}>
        <h3 style={{ marginTop: 0 }}>
          {locale === 'ko' ? '해결책 선택' : 'Select Resolution'}
        </h3>

        {/* Allowed Resolutions Dropdown (Constrained) */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            {locale === 'ko' ? '허용된 해결책:' : 'Allowed Resolution:'}
          </label>
          <select
            value={selectedOutcome}
            onChange={(e) => setSelectedOutcome(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            <option value="">{locale === 'ko' ? '선택하세요...' : 'Select...'}</option>
            {ALLOWED_RESOLUTIONS.map(resolution => (
              <option key={resolution} value={resolution}>
                {resolution}
              </option>
            ))}
          </select>
          <div style={{ fontSize: '0.85em', color: '#666', marginTop: '0.25rem' }}>
            {locale === 'ko' 
              ? '자유 입력 불가. 규칙에서 허용된 해결책만 선택 가능합니다.'
              : 'Free-form input not allowed. Only rule-allowed outcomes can be selected.'
            }
          </div>
        </div>

        {/* Audit Reason (Required) */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            {locale === 'ko' ? '감사 사유 (필수):' : 'Audit Reason (Required):'}
          </label>
          <textarea
            value={auditReason}
            onChange={(e) => setAuditReason(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ddd',
              minHeight: '100px'
            }}
            placeholder={locale === 'ko' 
              ? '이 해결책을 선택한 이유를 설명하세요...'
              : 'Explain why you selected this resolution...'
            }
          />
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '90%'
            }}>
              <h3>{locale === 'ko' ? '확인' : 'Confirmation'}</h3>
              <div style={{ marginBottom: '1rem' }}>
                <strong>{locale === 'ko' ? '선택된 해결책:' : 'Selected Outcome:'}</strong> {selectedOutcome}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>{locale === 'ko' ? '감사 사유:' : 'Audit Reason:'}</strong>
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f5f5f5', borderRadius: '4px' }}>
                  {auditReason}
                </div>
              </div>
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fff3cd', borderRadius: '4px' }}>
                {locale === 'ko'
                  ? '이 액션은 감사 이벤트로 기록됩니다.'
                  : 'This action will be logged as an audit event.'
                }
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  {locale === 'ko' ? '취소' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #0070f3',
                    borderRadius: '4px',
                    background: '#0070f3',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  {locale === 'ko' ? '확인' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={{ 
            marginBottom: '1rem', 
            padding: '0.75rem', 
            background: '#ffebee', 
            borderRadius: '4px',
            color: '#d32f2f'
          }}>
            {error.message}
          </div>
        )}

        {/* Submit Button */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              background: '#fff',
              cursor: 'pointer'
            }}
          >
            {locale === 'ko' ? '취소' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!selectedOutcome || !auditReason.trim()) {
                alert(locale === 'ko'
                  ? '해결책과 감사 사유를 모두 입력하세요.'
                  : 'Please provide both outcome and audit reason.'
                );
                return;
              }
              setShowConfirmation(true);
            }}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #0070f3',
              borderRadius: '4px',
              background: loading ? '#ccc' : '#0070f3',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading 
              ? (locale === 'ko' ? '처리 중...' : 'Processing...')
              : (locale === 'ko' ? '해결하기' : 'Resolve')
            }
          </button>
        </div>
      </form>
    </div>
  );
}
