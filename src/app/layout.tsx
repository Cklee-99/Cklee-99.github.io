import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Learning Journey',
  description: 'Recording my learning journey and growth',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-gray-50 dark:bg-gray-900 min-h-screen">{children}</body>
    </html>
  );
}
