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

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';

const mockUsePathname = vi.mocked(usePathname);

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

function renderSidebar(
  user: AuthUser | null,
  pathname = '/',
  isOpen = true,
  onClose = vi.fn(),
) {
  mockUsePathname.mockReturnValue(pathname);
  return render(
    <AuthProvider initialUser={user}>
      <Sidebar isOpen={isOpen} onClose={onClose} />
    </AuthProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Sidebar', () => {
  it('renders Painel and Projetos links for all users', () => {
    renderSidebar(regularUser);
    expect(screen.getByText('Painel')).toBeInTheDocument();
    expect(screen.getByText('Projetos')).toBeInTheDocument();
  });

  it('shows Equipe link for OWNER', () => {
    renderSidebar(ownerUser);
    expect(screen.getByText('Equipe')).toBeInTheDocument();
  });

  it('hides Equipe link for USER', () => {
    renderSidebar(regularUser);
    expect(screen.queryByText('Equipe')).not.toBeInTheDocument();
  });

  it('marks the active link based on current pathname', () => {
    renderSidebar(ownerUser, '/projects');
    const projectsLink = screen.getByText('Projetos').closest('a');
    expect(projectsLink?.className).toContain('bg-blue-500/20');
  });

  it('does not mark Painel as active when on /projects', () => {
    renderSidebar(ownerUser, '/projects');
    const dashboardLink = screen.getByText('Painel').closest('a');
    expect(dashboardLink?.className).not.toContain('bg-blue-500/20');
  });

  it('calls onClose when a nav link is clicked', () => {
    const onClose = vi.fn();
    renderSidebar(regularUser, '/', true, onClose);
    fireEvent.click(screen.getByText('Projetos'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    renderSidebar(regularUser, '/', true, onClose);
    fireEvent.click(screen.getByLabelText('Fechar menu'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = renderSidebar(regularUser, '/', true, onClose);
    const backdrop = container.querySelector(
      '[aria-hidden="true"]',
    ) as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when Escape is pressed while open', () => {
    const onClose = vi.fn();
    renderSidebar(regularUser, '/', true, onClose);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose on Escape when closed', () => {
    const onClose = vi.fn();
    renderSidebar(regularUser, '/', false, onClose);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });
});
