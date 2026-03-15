import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next/navigation', () => ({
    useRouter: vi.fn().mockReturnValue({ push: vi.fn() }),
}));

import { useRouter } from 'next/navigation';
import { ProjectForm } from './ProjectForm';

const mockUseRouter = vi.mocked(useRouter);

beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: vi.fn() } as any);
});

describe('ProjectForm', () => {
    it('renders all 7 form fields', () => {
        render(<ProjectForm onSubmit={vi.fn()} submitLabel="Create" />);
        expect(screen.getByLabelText(/Project Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Epic ID/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Squad Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Team Size/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Begin Date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Jira Backlog Filter ID/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Jira Throughput Filter ID/i)).toBeInTheDocument();
    });

    it('renders the submit button with the given label', () => {
        render(<ProjectForm onSubmit={vi.fn()} submitLabel="Save Project" />);
        expect(screen.getByRole('button', { name: 'Save Project' })).toBeInTheDocument();
    });

    it('renders a Cancel button', () => {
        render(<ProjectForm onSubmit={vi.fn()} submitLabel="Create" />);
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('pre-fills fields from initial prop', () => {
        render(
            <ProjectForm
                initial={{ name: 'Alpha', epicId: 'EPC-1', squadName: 'Squad A', teamSize: 8 }}
                onSubmit={vi.fn()}
                submitLabel="Update"
            />,
        );
        expect((screen.getByLabelText(/Project Name/i) as HTMLInputElement).value).toBe('Alpha');
        expect((screen.getByLabelText(/Epic ID/i) as HTMLInputElement).value).toBe('EPC-1');
        expect((screen.getByLabelText(/Squad Name/i) as HTMLInputElement).value).toBe('Squad A');
        expect((screen.getByLabelText(/Team Size/i) as HTMLInputElement).value).toBe('8');
    });

    it('shows "Saving..." label while submitting', async () => {
        let resolve!: () => void;
        const onSubmit = vi.fn(() => new Promise<void>((r) => { resolve = r; }));

        render(<ProjectForm onSubmit={onSubmit} submitLabel="Create" />);

        // Fill required fields
        await userEvent.type(screen.getByLabelText(/Project Name/i), 'Test');
        await userEvent.type(screen.getByLabelText(/Epic ID/i), 'EPC-1');
        await userEvent.type(screen.getByLabelText(/Squad Name/i), 'Squad');
        await userEvent.type(screen.getByLabelText(/Begin Date/i), '2025-01-06');

        fireEvent.submit(screen.getByRole('button', { name: 'Create' }));

        await waitFor(() => expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled());
        resolve();
    });

    it('calls onSubmit with correct shaped data', async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        render(<ProjectForm onSubmit={onSubmit} submitLabel="Create" />);

        await userEvent.clear(screen.getByLabelText(/Project Name/i));
        await userEvent.type(screen.getByLabelText(/Project Name/i), 'My Project');
        await userEvent.type(screen.getByLabelText(/Epic ID/i), 'MKT-100');
        await userEvent.type(screen.getByLabelText(/Squad Name/i), 'Backend');
        await userEvent.clear(screen.getByLabelText(/Team Size/i));
        await userEvent.type(screen.getByLabelText(/Team Size/i), '3');
        await userEvent.type(screen.getByLabelText(/Begin Date/i), '2025-01-06');
        await userEvent.type(screen.getByLabelText(/Jira Backlog Filter ID/i), '10001');
        await userEvent.type(screen.getByLabelText(/Jira Throughput Filter ID/i), '10002');

        fireEvent.submit(screen.getByRole('button', { name: 'Create' }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
        const arg = onSubmit.mock.calls[0][0];
        expect(arg.name).toBe('My Project');
        expect(arg.epicId).toBe('MKT-100');
        expect(arg.teamSize).toBe(3);
        expect(arg.statusConfig).toBeDefined();
    });

    it('displays error message when onSubmit throws', async () => {
        const onSubmit = vi.fn().mockRejectedValue(new Error('API down'));

        render(<ProjectForm onSubmit={onSubmit} submitLabel="Create" />);

        await userEvent.type(screen.getByLabelText(/Project Name/i), 'Fail');
        await userEvent.type(screen.getByLabelText(/Epic ID/i), 'X-1');
        await userEvent.type(screen.getByLabelText(/Squad Name/i), 'S');
        await userEvent.type(screen.getByLabelText(/Begin Date/i), '2025-01-06');

        fireEvent.submit(screen.getByRole('button', { name: 'Create' }));

        await waitFor(() => expect(screen.getByText('API down')).toBeInTheDocument());
    });

    it('Cancel button navigates to /projects', async () => {
        const mockPush = vi.fn();
        mockUseRouter.mockReturnValue({ push: mockPush } as any);

        render(<ProjectForm onSubmit={vi.fn()} submitLabel="Create" />);
        fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

        expect(mockPush).toHaveBeenCalledWith('/projects');
    });
});
