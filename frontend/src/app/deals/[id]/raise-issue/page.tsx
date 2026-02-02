'use client';

import { useParams, useRouter } from 'next/navigation';
import RaiseIssueForm from '@/components/deal/RaiseIssueForm';
import { getLocale } from '@/i18n/loader';

export default function RaiseIssuePage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  const locale = getLocale();

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto' }}>
      <h1>{locale === 'ko' ? '문제 제기' : 'Raise Issue'}</h1>
      
      <RaiseIssueForm
        dealId={dealId}
        locale={locale}
        onSuccess={() => {
          router.push(`/deals/${dealId}`);
        }}
        onCancel={() => {
          router.back();
        }}
      />
    </div>
  );
}
