'use client';

import { getLocalizedLabel, type DealState, type TimerKey, type Locale } from '@/i18n';

interface Timer {
  type: string;
  expiresAt: string;
  active: boolean;
}

interface TimelineProps {
  currentState: DealState;
  disputeOpen?: boolean;
  timers: Timer[];
  locale: Locale;
  timeline?: any; // DealTimeline from API
}

const STATE_ORDER: DealState[] = [
  'CREATED',
  'FUNDED',
  'DELIVERED',
  'INSPECTION',
  'APPROVED',
  'ISSUE',
  'SETTLED',
];

export default function Timeline({ currentState, disputeOpen, timers, locale }: TimelineProps) {
  const getStateIndex = (state: DealState): number => {
    return STATE_ORDER.indexOf(state);
  };

  const currentIndex = getStateIndex(currentState);
  const isStateReached = (state: DealState): boolean => {
    return getStateIndex(state) <= currentIndex;
  };

  const getTimerForState = (state: DealState): Timer | undefined => {
    if (state === 'INSPECTION') {
      return timers.find(t => t.type === 'AUTO_APPROVE' && t.active);
    }
    if (state === 'ISSUE' || disputeOpen) {
      return timers.find(t => t.type === 'DISPUTE_TTL' && t.active);
    }
    if (state === 'APPROVED') {
      return timers.find(t => t.type === 'HOLDBACK_RELEASE' && t.active);
    }
    return undefined;
  };

  const formatTimeRemaining = (expiresAt: string): string => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return locale === 'ko' ? '만료됨' : 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return locale === 'ko' ? `${days}일 ${hours}시간 남음` : `${days}d ${hours}h remaining`;
    }
    return locale === 'ko' ? `${hours}시간 남음` : `${hours}h remaining`;
  };

  return (
    <div style={{
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '1.5rem',
      background: '#f9f9f9'
    }}>
      <h2 style={{ marginTop: 0 }}>
        {locale === 'ko' ? '타임라인' : 'Timeline'}
        <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '0.5rem' }}>
          (State Machine)
        </span>
      </h2>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        position: 'relative'
      }}>
        {STATE_ORDER.map((state, index) => {
          if (state === 'ISSUE') return null; // ISSUE is overlay, not in main flow
          
          const reached = isStateReached(state);
          const isCurrent = state === currentState;
          const timer = getTimerForState(state);

          return (
            <div
              key={state}
              style={{
                flex: '1 1 120px',
                minWidth: '120px',
                padding: '1rem',
                border: isCurrent ? '2px solid #0070f3' : '1px solid #ddd',
                borderRadius: '8px',
                background: reached ? (isCurrent ? '#e3f2fd' : '#f5f5f5') : '#fff',
                position: 'relative'
              }}
            >
              {/* Canonical Key (small) */}
              <div style={{ fontSize: '0.7em', color: '#666', marginBottom: '0.25rem' }}>
                {state}
              </div>
              
              {/* Localized Label */}
              <div style={{ 
                fontWeight: isCurrent ? 'bold' : 'normal',
                fontSize: '1em'
              }}>
                {getLocalizedLabel(state, 'states', locale)}
              </div>

              {/* Timer Display */}
              {timer && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  background: '#fff3cd',
                  borderRadius: '4px',
                  fontSize: '0.85em'
                }}>
                  <div style={{ fontSize: '0.7em', color: '#666' }}>
                    {timer.type}
                  </div>
                  <div style={{ fontWeight: 'bold' }}>
                    {getLocalizedLabel(timer.type as TimerKey, 'timers', locale)}
                  </div>
                  <div style={{ fontSize: '0.9em', marginTop: '0.25rem' }}>
                    {formatTimeRemaining(timer.expiresAt)}
                  </div>
                </div>
              )}

              {/* Current State Indicator */}
              {isCurrent && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#0070f3',
                  border: '2px solid white'
                }} />
              )}
            </div>
          );
        })}

        {/* ISSUE Overlay */}
        {(currentState === 'ISSUE' || disputeOpen) && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '1rem',
            background: '#ffebee',
            border: '2px dashed #f44336',
            borderRadius: '8px',
            zIndex: 10,
            minWidth: '200px'
          }}>
            <div style={{ fontSize: '0.7em', color: '#666', marginBottom: '0.25rem' }}>
              ISSUE (Overlay)
            </div>
            <div style={{ fontWeight: 'bold', color: '#d32f2f' }}>
              {getLocalizedLabel('ISSUE', 'states', locale)}
            </div>
            {getTimerForState('ISSUE') && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85em' }}>
                {formatTimeRemaining(getTimerForState('ISSUE')!.expiresAt)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
