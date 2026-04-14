import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Project } from '@/lib/api-client';

vi.mock('next/navigation', () => ({
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

vi.mock('./actions', () => ({
  deleteProjectAction: vi.fn(),
}));

import { useRouter } from 'next/navigation';
import { deleteProjectAction } from './actions';
import { ProjectListClient } from './ProjectListClient';

const mockUseRouter = vi.mocked(useRouter);
const mockDeleteProject = vi.mocked(deleteProjectAction);

const makeProject = (id: string, name: string): Project => ({
  id,
  name,
  epicId: `EPIC-${id}`,
  squadName: 'Squad A',
  teamSize: 5,
  beginDate: '2025-01-06T00:00:00.000Z',
  jiraBacklogFilterId: '100',
  jiraThroughputFilterId: '200',
  statusConfig: {},
  companyId: 'c1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
});

beforeEach(() => {
  vi.clearAllMocks();
  mockUseRouter.mockReturnValue({ push: vi.fn() } as unknown as ReturnType<
    typeof useRouter
  >);
});

describe('ProjectListClient — empty state', () => {
  it('shows empty state message when no projects', () => {
    render(<ProjectListClient initialProjects={[]} />);
    expect(screen.getByText('Nenhum projeto ainda.')).toBeInTheDocument();
  });

  it('shows a link to create the first project', () => {
    render(<ProjectListClient initialProjects={[]} />);
    expect(screen.getByText(/Crie seu primeiro projeto/)).toBeInTheDocument();
  });
});

describe('ProjectListClient — with projects', () => {
  const projects = [makeProject('1', 'Alpha'), makeProject('2', 'Beta')];

  it('renders each project name', () => {
    render(<ProjectListClient initialProjects={projects} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders Epic IDs', () => {
    render(<ProjectListClient initialProjects={projects} />);
    expect(screen.getByText('EPIC-1')).toBeInTheDocument();
    expect(screen.getByText('EPIC-2')).toBeInTheDocument();
  });

  it('renders formatted begin date', () => {
    render(<ProjectListClient initialProjects={projects} />);
    expect(screen.getAllByText('06/01/2025').length).toBeGreaterThanOrEqual(1);
  });

  it('renders delete buttons for each project', () => {
    render(<ProjectListClient initialProjects={projects} />);
    expect(screen.getAllByTitle('Excluir projeto')).toHaveLength(2);
  });

  it('shows confirmation prompt when delete button is clicked', () => {
    render(<ProjectListClient initialProjects={[makeProject('1', 'Alpha')]} />);

    fireEvent.click(document.getElementById('delete-project-1')!);

    expect(screen.getByText('Excluir?')).toBeInTheDocument();
    expect(document.getElementById('confirm-delete-1')).toBeInTheDocument();
  });

  it('cancels delete when No is clicked', () => {
    render(<ProjectListClient initialProjects={[makeProject('1', 'Alpha')]} />);

    fireEvent.click(document.getElementById('delete-project-1')!);
    fireEvent.click(screen.getByText('Não'));

    expect(screen.queryByText('Excluir?')).not.toBeInTheDocument();
  });

  it('removes project from list after confirmed delete', async () => {
    mockDeleteProject.mockResolvedValue({ success: true });
    render(
      <ProjectListClient
        initialProjects={[makeProject('1', 'Alpha'), makeProject('2', 'Beta')]}
      />,
    );

    fireEvent.click(document.getElementById('delete-project-1')!);
    fireEvent.click(document.getElementById('confirm-delete-1')!);

    await waitFor(() =>
      expect(screen.queryByText('Alpha')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('does not remove project when delete returns error', async () => {
    mockDeleteProject.mockResolvedValue({ error: 'Forbidden' });
    render(<ProjectListClient initialProjects={[makeProject('1', 'Alpha')]} />);

    fireEvent.click(document.getElementById('delete-project-1')!);
    fireEvent.click(document.getElementById('confirm-delete-1')!);

    await waitFor(() => expect(mockDeleteProject).toHaveBeenCalled());
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('navigates to status page when project name is clicked', () => {
    const mockPush = vi.fn();
    mockUseRouter.mockReturnValue({ push: mockPush } as unknown as ReturnType<
      typeof useRouter
    >);
    render(<ProjectListClient initialProjects={[makeProject('1', 'Alpha')]} />);

    fireEvent.click(document.getElementById('view-project-1')!);
    expect(mockPush).toHaveBeenCalledWith('/projects/1/status');
  });

  it('renders edit link pointing to /projects/:id/edit', () => {
    render(<ProjectListClient initialProjects={[makeProject('1', 'Alpha')]} />);
    const editLink = document.getElementById('edit-project-1')!;
    expect(editLink.getAttribute('href')).toBe('/projects/1/edit');
  });
});
