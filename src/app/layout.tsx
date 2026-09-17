import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Breakpoint',
  description: 'Simulating a cloud cost attack and automated circuit breaker platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-sentry-bg text-foreground min-h-screen">
        {children}
      </body>
    </html>
  );
}
