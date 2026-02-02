'use client';

import { useState } from 'react';
import { useDisputeList } from '@/lib/api/hooks';
import { getLocalizedLabel, formatTimer, type Locale } from '@/i18n';
import { getLocale } from '@/i18n/loader';
import Link from 'next/link';

export default function AdminDisputesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const locale = getLocale();
  const { disputes, loading, error } = useDisputeList(statusFilter || undefined);

  // Sort by TTL ascending (most urgent first)
  const sortedDisputes = [...(disputes || [])].sort((a, b) => {
    const aExpires = new Date(a.expiresAt).getTime();
    const bExpires = new Date(b.expiresAt).getTime();
    return aExpires - bExpires;
  });

  // Filter by category if needed
  const filteredDisputes = categoryFilter
    ? sortedDisputes.filter(d => {
        // Category would come from deal data - simplified for now
        return true;
      })
    : sortedDisputes;

  const getTimeRemaining = (expiresAt: string): string => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) {
      return locale === 'ko' ? '만료됨' : 'Expired';
    }
    
    return formatTimer(diff, locale);
  };

  const getSeverity = (reasonCode: string): string => {
    if (reasonCode === 'DAMAGE_MAJOR' || reasonCode === 'NOT_DELIVERED') {
      return locale === 'ko' ? '높음' : 'High';
    }
    if (reasonCode === 'DAMAGE_MINOR' || reasonCode === 'MISSING_PARTS') {
      return locale === 'ko' ? '중간' : 'Medium';
    }
    return locale === 'ko' ? '낮음' : 'Low';
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading disputes...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        Error: {error.message}
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>{locale === 'ko' ? '관리자 - 분쟁 목록' : 'Admin - Dispute List'}</h1>

      {/* Filters */}
      <div style={{ 
        marginBottom: '2rem', 
        display: 'flex', 
        gap: '1rem',
        padding: '1rem',
        background: '#f9f9f9',
        borderRadius: '8px'
      }}>
        <div>
          <label style={{ marginRight: '0.5rem' }}>
            {locale === 'ko' ? '상태:' : 'Status:'}
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.25rem' }}
          >
            <option value="">{locale === 'ko' ? '전체' : 'All'}</option>
            <option value="OPEN">{locale === 'ko' ? '진행 중' : 'Open'}</option>
            <option value="RESOLVED">{locale === 'ko' ? '해결됨' : 'Resolved'}</option>
          </select>
        </div>
        <div>
          <label style={{ marginRight: '0.5rem' }}>
            {locale === 'ko' ? '카테고리:' : 'Category:'}
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: '0.25rem' }}
          >
            <option value="">{locale === 'ko' ? '전체' : 'All'}</option>
            <option value="CAR">CAR</option>
            <option value="REAL_ESTATE_RENTAL">REAL_ESTATE_RENTAL</option>
            <option value="REAL_ESTATE_SALE">REAL_ESTATE_SALE</option>
            <option value="HIGH_VALUE_USED">HIGH_VALUE_USED</option>
            <option value="B2B_DELIVERY">B2B_DELIVERY</option>
          </select>
        </div>
      </div>

      {/* Disputes Table */}
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        background: '#fff',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              {locale === 'ko' ? '거래 ID' : 'Deal ID'}
            </th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              {locale === 'ko' ? '카테고리' : 'Category'}
            </th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              {locale === 'ko' ? '상태' : 'Status'}
            </th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              {locale === 'ko' ? '남은 시간 (TTL)' : 'Time Remaining (TTL)'}
            </th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              {locale === 'ko' ? '심각도' : 'Severity'}
            </th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              {locale === 'ko' ? '사유 코드' : 'Reason Code'}
            </th>
            <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              {locale === 'ko' ? '액션' : 'Action'}
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredDisputes.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                {locale === 'ko' ? '분쟁이 없습니다.' : 'No disputes found.'}
              </td>
            </tr>
          ) : (
            filteredDisputes.map((dispute) => (
              <tr key={dispute.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '1rem' }}>
                  <Link href={`/deals/${dispute.dealId}`} style={{ color: '#0070f3' }}>
                    {dispute.dealId.substring(0, 8)}...
                  </Link>
                </td>
                <td style={{ padding: '1rem' }}>
                  {/* Category would come from deal - placeholder */}
                  -
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    background: dispute.status === 'OPEN' ? '#fff3cd' : '#d4edda',
                    color: dispute.status === 'OPEN' ? '#856404' : '#155724',
                    fontSize: '0.9em'
                  }}>
                    {dispute.status}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ 
                    fontWeight: dispute.status === 'OPEN' ? 'bold' : 'normal',
                    color: dispute.status === 'OPEN' && new Date(dispute.expiresAt) < new Date() 
                      ? '#d32f2f' 
                      : '#666'
                  }}>
                    {getTimeRemaining(dispute.expiresAt)}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  {getSeverity(dispute.reasonCode)}
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.85em', color: '#666' }}>
                    {dispute.reasonCode}
                  </div>
                  <div style={{ fontSize: '0.9em' }}>
                    {getLocalizedLabel(dispute.reasonCode as any, 'reasonCodes', locale)}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  {dispute.status === 'OPEN' && (
                    <Link 
                      href={`/admin/disputes/${dispute.id}/resolve`}
                      style={{ 
                        color: '#0070f3',
                        textDecoration: 'none'
                      }}
                    >
                      {locale === 'ko' ? '해결하기' : 'Resolve'} →
                    </Link>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
