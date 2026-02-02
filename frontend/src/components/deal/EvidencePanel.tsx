'use client';

import { useState, useEffect } from 'react';
import { type Locale } from '@/i18n';
import { t } from '@/i18n/loader';
import { api, type EvidenceMetadata } from '@/lib/api/client';
import { useDealTimeline } from '@/lib/api/hooks';

interface EvidencePanelProps {
  dealId: string;
  locale: Locale;
  onEvidenceAdded?: () => void;
}

export default function EvidencePanel({ dealId, locale, onEvidenceAdded }: EvidencePanelProps) {
  const { timeline } = useDealTimeline(dealId);
  const [evidence, setEvidence] = useState<EvidenceMetadata[]>([]);
  const [uploading, setUploading] = useState(false);

  // Extract evidence from timeline
  useEffect(() => {
    if (timeline) {
      const evidenceItems = timeline.items
        .filter(item => item.type === 'EVIDENCE')
        .map(item => item.data as EvidenceMetadata);
      setEvidence(evidenceItems);
    }
  }, [timeline]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // For Phase 2, we'll use a placeholder URI
      // In production, this would upload to storage and get a real URI
      const placeholderUri = `placeholder://evidence/${dealId}/${Date.now()}/${file.name}`;
      
      // Create evidence metadata
      // Note: This would typically be done via a separate evidence upload endpoint
      // For now, we'll simulate it
      const newEvidence: EvidenceMetadata = {
        id: `evidence-${Date.now()}`,
        dealId,
        uploadedBy: 'current-user', // Will come from auth
        type: file.type.startsWith('image/') ? 'PHOTO' : 
              file.type.startsWith('video/') ? 'VIDEO' : 'REPORT',
        uri: placeholderUri,
        createdAt: new Date().toISOString(),
      };

      // In real implementation, call API to create evidence
      // await api.evidence.create(dealId, newEvidence);
      
      setEvidence(prev => [...prev, newEvidence]);
      if (onEvidenceAdded) {
        onEvidenceAdded();
      }
    } catch (error) {
      console.error('Failed to upload evidence:', error);
      alert(locale === 'ko' ? '증빙 업로드 실패' : 'Failed to upload evidence');
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  return (
    <div style={{
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '1.5rem',
      background: '#f9f9f9'
    }}>
      <h3 style={{ marginTop: 0 }}>
        {t('ui.evidence', locale)}
      </h3>

      {/* Upload Section */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{
          display: 'inline-block',
          padding: '0.5rem 1rem',
          background: '#0070f3',
          color: 'white',
          borderRadius: '4px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          opacity: uploading ? 0.6 : 1
        }}>
          {uploading 
            ? (locale === 'ko' ? '업로드 중...' : 'Uploading...')
            : t('actions.uploadEvidence', locale)
          }
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ display: 'none' }}
            accept="image/*,video/*,.pdf,.doc,.docx"
          />
        </label>
      </div>

      {/* Evidence List */}
      {evidence.length === 0 ? (
        <p style={{ color: '#666' }}>
          {locale === 'ko' ? '증빙이 없습니다.' : 'No evidence uploaded.'}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {evidence.map((item) => (
            <li 
              key={item.id} 
              style={{ 
                marginBottom: '0.5rem',
                padding: '0.75rem',
                background: '#fff',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>
                    {item.type}
                  </div>
                  <div style={{ fontSize: '0.85em', color: '#666', marginTop: '0.25rem' }}>
                    {item.uri}
                  </div>
                  <div style={{ fontSize: '0.8em', color: '#999', marginTop: '0.25rem' }}>
                    {new Date(item.createdAt).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US')}
                  </div>
                </div>
                <div style={{ fontSize: '0.8em', color: '#666' }}>
                  {item.uploadedBy}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
