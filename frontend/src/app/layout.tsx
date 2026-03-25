import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Project Dashboard v3',
  description: 'Jira project tracking with Monte Carlo forecasting',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const suppressWarning = process.env.NODE_ENV === 'development';

  return (
    <html
      lang="en"
      {...(suppressWarning && { suppressHydrationWarning: true })}
    >
      <body
        className={`${inter.className} min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white`}
      >
        {children}
      </body>
    </html>
  );
}
