import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider } from '@/lib/auth-context';
import type { AuthUser } from '@/lib/auth-context';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn().mockReturnValue('/'),
    useRouter: vi.fn().mockReturnValue({ push: vi.fn() }),
}));

vi.mock('next/link', () => ({
    default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
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

const ownerUser: AuthUser = { id: '1', email: 'o@t.com', name: 'Alice', role: 'OWNER', companyId: 'c1', companyName: 'Acme' };
const regularUser: AuthUser = { id: '2', email: 'u@t.com', name: 'Bob', role: 'USER', companyId: 'c1', companyName: 'Acme' };

function renderNavbar(user: AuthUser | null, pathname = '/') {
    mockUsePathname.mockReturnValue(pathname);
    return render(
        <AuthProvider initialUser={user}>
            <Navbar />
        </AuthProvider>,
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: vi.fn() } as any);
});

describe('Navbar', () => {
    it('renders Dashboard and Projects links for all users', () => {
        renderNavbar(regularUser);
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Projects')).toBeInTheDocument();
    });

    it('shows Team link for OWNER', () => {
        renderNavbar(ownerUser);
        expect(screen.getByText('Team')).toBeInTheDocument();
    });

    it('hides Team link for USER', () => {
        renderNavbar(regularUser);
        expect(screen.queryByText('Team')).not.toBeInTheDocument();
    });

    it('displays the logged-in user name', () => {
        renderNavbar(ownerUser);
        expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('displays Owner role badge for OWNER', () => {
        renderNavbar(ownerUser);
        expect(screen.getByText(/Owner/)).toBeInTheDocument();
    });

    it('displays Member role badge for USER', () => {
        renderNavbar(regularUser);
        expect(screen.getByText('Member')).toBeInTheDocument();
    });

    it('does not show user section when user is null', () => {
        renderNavbar(null);
        expect(screen.queryByTitle('Sign out')).not.toBeInTheDocument();
    });

    it('calls logoutAction and redirects to /sign-in on logout click', async () => {
        const mockPush = vi.fn();
        mockUseRouter.mockReturnValue({ push: mockPush } as any);

        renderNavbar(ownerUser);

        const logoutBtn = screen.getByTitle('Sign out');
        fireEvent.click(logoutBtn);

        // Allow async handler to complete
        await vi.waitFor(() => expect(mockLogoutAction).toHaveBeenCalledOnce());
        await vi.waitFor(() => expect(mockPush).toHaveBeenCalledWith('/sign-in'));
    });

    it('marks the active link based on current pathname', () => {
        renderNavbar(ownerUser, '/projects');
        const projectsLink = screen.getByText('Projects').closest('a');
        expect(projectsLink?.className).toContain('bg-blue-500/20');
    });

    it('does not mark Dashboard as active when on /projects', () => {
        renderNavbar(ownerUser, '/projects');
        const dashboardLink = screen.getByText('Dashboard').closest('a');
        expect(dashboardLink?.className).not.toContain('bg-blue-500/20');
    });
});
