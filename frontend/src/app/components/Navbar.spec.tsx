import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider } from '@/lib/auth-context';
import type { AuthUser } from '@/lib/auth-context';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn().mockReturnValue('/'),
  useRouter: vi.fn().mockReturnValue({ push: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.ComponentPropsWithoutRef<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/actions/auth', () => ({
  logoutAction: vi.fn().mockResolvedValue(undefined),
}));

import { usePathname, useRouter } from 'next/navigation';
import { logoutAction } from '@/lib/actions/auth';
import { Navbar } from './Navbar';

const mockUsePathname = vi.mocked(usePathname);
const mockUseRouter = vi.mocked(useRouter);
const mockLogoutAction = vi.mocked(logoutAction);

const ownerUser: AuthUser = {
  id: '1',
  email: 'o@t.com',
  name: 'Alice',
  role: 'OWNER',
  companyId: 'c1',
  companyName: 'Acme',
};
const regularUser: AuthUser = {
  id: '2',
  email: 'u@t.com',
  name: 'Bob',
  role: 'USER',
  companyId: 'c1',
  companyName: 'Acme',
};

function renderNavbar(user: AuthUser | null, pathname = '/') {
  mockUsePathname.mockReturnValue(pathname);
  return render(
    <AuthProvider initialUser={user}>
      <Navbar onMenuClick={vi.fn()} />
    </AuthProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseRouter.mockReturnValue({ push: vi.fn() } as unknown as ReturnType<
    typeof useRouter
  >);
});

describe('Navbar', () => {
  it('hides Team link for USER', () => {
    renderNavbar(regularUser);
    expect(screen.queryByText('Equipe')).not.toBeInTheDocument();
  });

  it('displays the logged-in user name', () => {
    renderNavbar(ownerUser);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('displays Owner role badge for OWNER', () => {
    renderNavbar(ownerUser);
    expect(screen.getByText(/Proprietário/)).toBeInTheDocument();
  });

  it('displays Member role badge for USER', () => {
    renderNavbar(regularUser);
    expect(screen.getByText('Membro')).toBeInTheDocument();
  });

  it('does not show user section when user is null', () => {
    renderNavbar(null);
    expect(screen.queryByTitle('Sair')).not.toBeInTheDocument();
  });

  it('calls logoutAction and redirects to /sign-in on logout click', async () => {
    const mockPush = vi.fn();
    mockUseRouter.mockReturnValue({ push: mockPush } as unknown as ReturnType<
      typeof useRouter
    >);

    renderNavbar(ownerUser);

    const logoutBtn = screen.getByTitle('Sair');
    fireEvent.click(logoutBtn);

    // Allow async handler to complete
    await vi.waitFor(() => expect(mockLogoutAction).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(mockPush).toHaveBeenCalledWith('/sign-in'));
  });
});
