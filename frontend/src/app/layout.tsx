import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trust Escrow Platform',
  description: 'Trust & Escrow transaction platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
