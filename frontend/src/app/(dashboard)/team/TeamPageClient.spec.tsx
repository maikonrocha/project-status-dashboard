import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TeamMember } from '@/lib/api-client';

vi.mock('next/navigation', () => ({
    useRouter: vi.fn().mockReturnValue({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('./actions', () => ({
    inviteAction: vi.fn(),
}));

import { useRouter } from 'next/navigation';
import { inviteAction } from './actions';
import { TeamPageClient } from './TeamPageClient';

const mockUseRouter = vi.mocked(useRouter);
const mockInviteAction = vi.mocked(inviteAction);

const makeMember = (id: string, name: string | null, role: 'OWNER' | 'USER', isVerified = true): TeamMember => ({
    id,
    email: `${id}@test.com`,
    name,
    role,
    isVerified,
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
});

beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: vi.fn(), refresh: vi.fn() } as any);
});

describe('TeamPageClient — empty state', () => {
    it('shows empty state message when no members', () => {
        render(<TeamPageClient initialMembers={[]} companyName="Acme" />);
        expect(screen.getByText(/No team members yet/i)).toBeInTheDocument();
    });
});

describe('TeamPageClient — members table', () => {
    const members = [
        makeMember('1', 'Alice', 'OWNER', true),
        makeMember('2', 'Bob', 'USER', false),
        makeMember('3', null, 'USER', false),
    ];

    it('renders member names', () => {
        render(<TeamPageClient initialMembers={members} companyName="Acme" />);
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('shows "Pending invite" for members without name', () => {
        render(<TeamPageClient initialMembers={members} companyName="Acme" />);
        expect(screen.getByText('Pending invite')).toBeInTheDocument();
    });

    it('shows company name in subtitle', () => {
        render(<TeamPageClient initialMembers={members} companyName="Acme Corp" />);
        expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    });

    it('shows Owner badge for OWNER role', () => {
        render(<TeamPageClient initialMembers={members} companyName="Acme" />);
        expect(screen.getByText(/Owner/)).toBeInTheDocument();
    });

    it('shows Verified status for verified members', () => {
        render(<TeamPageClient initialMembers={members} companyName="Acme" />);
        expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('shows Pending status for unverified members', () => {
        render(<TeamPageClient initialMembers={members} companyName="Acme" />);
        const pendingElements = screen.getAllByText('Pending');
        expect(pendingElements.length).toBeGreaterThanOrEqual(1);
    });
});

describe('TeamPageClient — invite form', () => {
    it('renders invite email input and Send Invite button', () => {
        render(<TeamPageClient initialMembers={[]} companyName="Acme" />);
        expect(screen.getByPlaceholderText(/colleague@company.com/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Send Invite/i })).toBeInTheDocument();
    });

    it('shows success message after successful invite', async () => {
        mockInviteAction.mockResolvedValue({ success: true });
        render(<TeamPageClient initialMembers={[]} companyName="Acme" />);

        await userEvent.type(screen.getByPlaceholderText(/colleague/i), 'new@user.com');
        await userEvent.click(screen.getByRole('button', { name: /Send Invite/i }));

        await waitFor(() => expect(screen.getByText(/Invitation sent to new@user.com/)).toBeInTheDocument());
    });

    it('clears the email input after successful invite', async () => {
        mockInviteAction.mockResolvedValue({ success: true });
        render(<TeamPageClient initialMembers={[]} companyName="Acme" />);

        const input = screen.getByPlaceholderText(/colleague/i) as HTMLInputElement;
        await userEvent.type(input, 'new@user.com');
        await userEvent.click(screen.getByRole('button', { name: /Send Invite/i }));

        await waitFor(() => expect(input.value).toBe(''));
    });

    it('shows error message when invite fails', async () => {
        mockInviteAction.mockResolvedValue({ error: 'Email já convidado.' });
        render(<TeamPageClient initialMembers={[]} companyName="Acme" />);

        await userEvent.type(screen.getByPlaceholderText(/colleague/i), 'dup@user.com');
        await userEvent.click(screen.getByRole('button', { name: /Send Invite/i }));

        await waitFor(() => expect(screen.getByText('Email já convidado.')).toBeInTheDocument());
    });

    it('disables button while invite is in progress', async () => {
        let resolve!: (v: any) => void;
        mockInviteAction.mockReturnValue(new Promise((r) => { resolve = r; }));
        render(<TeamPageClient initialMembers={[]} companyName="Acme" />);

        await userEvent.type(screen.getByPlaceholderText(/colleague/i), 'x@y.com');
        await userEvent.click(screen.getByRole('button', { name: /Send Invite/i }));

        await waitFor(() => expect(screen.getByRole('button', { name: /Send Invite/i })).toBeDisabled());
        resolve({ success: true });
    });
});
