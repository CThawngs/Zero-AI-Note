import type { Metadata } from 'next';
import { AppProvider } from '@/src/context/AppContext';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'Zero AI Note',
  description: 'AI-Powered Research — Ghi chú AI đa định dạng theo phương pháp học thuật',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}