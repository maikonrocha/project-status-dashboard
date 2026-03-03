import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from './components/Navbar';

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
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
