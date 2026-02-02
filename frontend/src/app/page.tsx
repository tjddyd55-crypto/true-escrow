import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Trust Escrow Platform</h1>
      <nav>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link href="/i18n-demo" style={{ color: '#0070f3' }}>i18n Demo</Link>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link href="/deals/test-deal-1" style={{ color: '#0070f3' }}>Deal Detail (Demo)</Link>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link href="/admin/disputes" style={{ color: '#0070f3' }}>Admin - Disputes</Link>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link href="/smoke-test" style={{ color: '#0070f3' }}>Smoke Tests</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
