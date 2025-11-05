import '@/styles/globals.css';
import { Providers } from './providers';
import { FontPreloader } from '@/components/FontPreloader';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Logverse',
  description: 'Logverse maps the constellation of a life.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <FontPreloader />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
