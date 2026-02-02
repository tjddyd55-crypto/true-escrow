'use client';

import { useState } from 'react';
import { api, type IssueRequest } from '@/lib/api/client';
import { useDealMutation } from '@/lib/api/hooks';
import { getLocalizedLabel, t, type IssueReasonCode, type Locale } from '@/i18n';
import { useDealTimeline } from '@/lib/api/hooks';

interface RaiseIssueFormProps {
  dealId: string;
  locale: Locale;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const REASON_CODES: IssueReasonCode[] = [
  'NOT_DELIVERED',
  'DAMAGE_MAJOR',
  'DAMAGE_MINOR',
  'MISSING_PARTS',
  'QUALITY_NOT_MATCHING',
  'DOCUMENT_MISMATCH',
  'OTHER',
];

export default function RaiseIssueForm({ dealId, locale, onSuccess, onCancel }: RaiseIssueFormProps) {
  const [reasonCode, setReasonCode] = useState<IssueReasonCode>('NOT_DELIVERED');
  const [freeText, setFreeText] = useState('');
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const { timeline } = useDealTimeline(dealId);
  const { mutate, loading, error } = useDealMutation();

  // Get evidence IDs from timeline
  const availableEvidence = timeline?.items
    .filter(item => item.type === 'EVIDENCE')
    .map(item => (item.data as any).id) || [];

  const canSubmit = evidenceIds.length >= 1 || reasonCode !== 'OTHER'; // Evidence required unless template waives

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      alert(locale === 'ko' 
        ? '증빙이 필요합니다. (템플릿에서 면제된 경우 제외)'
        : 'Evidence is required. (Unless template waives it)'
      );
      return;
    }

    if (reasonCode === 'OTHER' && !freeText.trim()) {
      alert(locale === 'ko'
        ? 'OTHER 사유의 경우 자유 텍스트가 필요합니다.'
        : 'Free text is required for OTHER reason code.'
      );
      return;
    }

    const request: IssueRequest = {
      reasonCode,
      freeText: reasonCode === 'OTHER' ? freeText : undefined,
      evidenceIds,
    };

    try {
      await mutate(
        () => api.deals.raiseIssue(dealId, request),
        () => {
          if (onSuccess) {
            onSuccess();
          } else {
            window.location.reload();
          }
        }
      );
    } catch (err) {
      console.error('Failed to raise issue:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '1.5rem',
      background: '#fff',
      maxWidth: '600px'
    }}>
      <h3 style={{ marginTop: 0 }}>
        {t('actions.raiseIssue', locale)}
      </h3>

      {/* Reason Code Selection */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          {locale === 'ko' ? '사유 코드' : 'Reason Code'}
        </label>
        <select
          value={reasonCode}
          onChange={(e) => setReasonCode(e.target.value as IssueReasonCode)}
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
        >
          {REASON_CODES.map(code => (
            <option key={code} value={code}>
              {code} / {getLocalizedLabel(code, 'reasonCodes', locale)}
            </option>
          ))}
        </select>
      </div>

      {/* Free Text (required for OTHER) */}
      {reasonCode === 'OTHER' && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            {locale === 'ko' ? '자유 텍스트 (필수)' : 'Free Text (Required)'}
          </label>
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ddd',
              minHeight: '100px'
            }}
          />
        </div>
      )}

      {/* Evidence Selection */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          {locale === 'ko' ? '증빙 (필수)' : 'Evidence (Required)'}
        </label>
        {availableEvidence.length === 0 ? (
          <div style={{ 
            padding: '1rem', 
            background: '#fff3cd', 
            borderRadius: '4px',
            marginBottom: '0.5rem'
          }}>
            {locale === 'ko' 
              ? '증빙이 없습니다. 먼저 증빙을 업로드하세요.'
              : 'No evidence available. Please upload evidence first.'
            }
          </div>
        ) : (
          <div>
            {availableEvidence.map(evidenceId => (
              <label key={evidenceId} style={{ display: 'block', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={evidenceIds.includes(evidenceId)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setEvidenceIds([...evidenceIds, evidenceId]);
                    } else {
                      setEvidenceIds(evidenceIds.filter(id => id !== evidenceId));
                    }
                  }}
                  style={{ marginRight: '0.5rem' }}
                />
                {evidenceId}
              </label>
            ))}
          </div>
        )}
        {!canSubmit && (
          <div style={{ 
            marginTop: '0.5rem', 
            color: '#d32f2f', 
            fontSize: '0.9em' 
          }}>
            {locale === 'ko'
              ? '최소 1개의 증빙이 필요합니다.'
              : 'At least 1 evidence is required.'
            }
          </div>
        )}
      </div>

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

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              background: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {locale === 'ko' ? '취소' : 'Cancel'}
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !canSubmit}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #0070f3',
            borderRadius: '4px',
            background: (loading || !canSubmit) ? '#ccc' : '#0070f3',
            color: 'white',
            cursor: (loading || !canSubmit) ? 'not-allowed' : 'pointer',
            opacity: (loading || !canSubmit) ? 0.6 : 1
          }}
        >
          {loading 
            ? (locale === 'ko' ? '제출 중...' : 'Submitting...')
            : t('actions.raiseIssue', locale)
          }
        </button>
      </div>
    </form>
  );
}
