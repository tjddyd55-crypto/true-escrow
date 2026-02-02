'use client';

import { useState } from 'react';
import { 
  getLocalizedLabel, 
  formatCurrency, 
  formatTimer,
  getLocale,
  setLocale,
  type Locale,
  type DealState,
  type TimerKey,
  type IssueReasonCode
} from '@/i18n';

export default function I18nDemoPage() {
  const [locale, setLocaleState] = useState<Locale>(getLocale());

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setLocaleState(newLocale);
    // Reload to apply new locale (or use state management for SPA)
    window.location.reload();
  };

  // Demo canonical keys (these remain English in code)
  const demoState: DealState = 'INSPECTION';
  const demoTimer: TimerKey = 'AUTO_APPROVE';
  const demoReasonCode: IssueReasonCode = 'NOT_DELIVERED';

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>i18n Foundation Demo</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <label>
          Locale: 
          <select 
            value={locale} 
            onChange={(e) => handleLocaleChange(e.target.value as Locale)}
            style={{ marginLeft: '0.5rem', padding: '0.25rem' }}
          >
            <option value="ko">한국어 (ko)</option>
            <option value="en">English (en)</option>
          </select>
        </label>
      </div>

      <div style={{ 
        border: '1px solid #ccc', 
        padding: '1rem', 
        borderRadius: '4px',
        marginBottom: '1rem'
      }}>
        <h2>State Label Demo</h2>
        <p>
          <strong>Canonical Key:</strong> <code>{demoState}</code>
        </p>
        <p>
          <strong>Localized Label ({locale}):</strong>{' '}
          {getLocalizedLabel(demoState, 'states', locale)}
        </p>
      </div>

      <div style={{ 
        border: '1px solid #ccc', 
        padding: '1rem', 
        borderRadius: '4px',
        marginBottom: '1rem'
      }}>
        <h2>Timer Label Demo</h2>
        <p>
          <strong>Canonical Key:</strong> <code>{demoTimer}</code>
        </p>
        <p>
          <strong>Localized Label ({locale}):</strong>{' '}
          {getLocalizedLabel(demoTimer, 'timers', locale)}
        </p>
        <p>
          <strong>Formatted Duration:</strong>{' '}
          {formatTimer(7 * 24 * 60 * 60 * 1000, locale)} (7 days)
        </p>
      </div>

      <div style={{ 
        border: '1px solid #ccc', 
        padding: '1rem', 
        borderRadius: '4px',
        marginBottom: '1rem'
      }}>
        <h2>Reason Code Label Demo</h2>
        <p>
          <strong>Canonical Key:</strong> <code>{demoReasonCode}</code>
        </p>
        <p>
          <strong>Localized Label ({locale}):</strong>{' '}
          {getLocalizedLabel(demoReasonCode, 'reasonCodes', locale)}
        </p>
      </div>

      <div style={{ 
        border: '1px solid #ccc', 
        padding: '1rem', 
        borderRadius: '4px'
      }}>
        <h2>Currency Formatting Demo</h2>
        <p>
          <strong>USD 1000.00 ({locale}):</strong>{' '}
          {formatCurrency(1000.00, 'USD', locale)}
        </p>
        <p>
          <strong>KRW 1000000 ({locale}):</strong>{' '}
          {formatCurrency(1000000, 'KRW', locale)}
        </p>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f0f0', borderRadius: '4px' }}>
        <h3>Key Points</h3>
        <ul>
          <li>✅ Canonical keys remain English in code: <code>{demoState}</code>, <code>{demoTimer}</code></li>
          <li>✅ UI labels are locale-based and switch dynamically</li>
          <li>✅ Layout does not break when switching locales</li>
          <li>✅ Fallback to canonical key if translation missing</li>
        </ul>
      </div>
    </div>
  );
}
