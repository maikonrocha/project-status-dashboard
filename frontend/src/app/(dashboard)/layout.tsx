'use client';

import { AuthProvider } from '@/lib/auth-context';
import { Navbar } from '../components/Navbar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <Navbar />
            {children}
        </AuthProvider>
    );
}
