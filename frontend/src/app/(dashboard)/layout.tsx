import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthProvider, type AuthUser } from '@/lib/auth-context';
import { DashboardShell } from '../components/DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) redirect('/sign-in');

  const userCookie = cookieStore.get('auth_user')?.value;
  const user: AuthUser | null = userCookie
    ? (JSON.parse(userCookie) as AuthUser)
    : null;

  return (
    <AuthProvider initialUser={user}>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
