import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth, type AuthUser } from './auth-context';

const ownerUser: AuthUser = {
    id: '1',
    email: 'owner@test.com',
    name: 'Owner',
    role: 'OWNER',
    companyId: 'c1',
    companyName: 'Acme',
};

const regularUser: AuthUser = {
    id: '2',
    email: 'user@test.com',
    name: 'Regular',
    role: 'USER',
    companyId: 'c1',
    companyName: 'Acme',
};

function ConsumerComponent() {
    const { user, isAuthenticated, isOwner } = useAuth();
    return (
        <div>
            <span data-testid="authenticated">{String(isAuthenticated)}</span>
            <span data-testid="owner">{String(isOwner)}</span>
            <span data-testid="name">{user?.name ?? 'null'}</span>
        </div>
    );
}

describe('AuthProvider', () => {
    it('renders children', () => {
        render(
            <AuthProvider initialUser={null}>
                <span>child</span>
            </AuthProvider>,
        );
        expect(screen.getByText('child')).toBeInTheDocument();
    });

    it('provides isAuthenticated=false and isOwner=false when user is null', () => {
        render(
            <AuthProvider initialUser={null}>
                <ConsumerComponent />
            </AuthProvider>,
        );
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
        expect(screen.getByTestId('owner').textContent).toBe('false');
        expect(screen.getByTestId('name').textContent).toBe('null');
    });

    it('provides isAuthenticated=true and user when user is set', () => {
        render(
            <AuthProvider initialUser={ownerUser}>
                <ConsumerComponent />
            </AuthProvider>,
        );
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
        expect(screen.getByTestId('name').textContent).toBe('Owner');
    });

    it('provides isOwner=true for OWNER role', () => {
        render(
            <AuthProvider initialUser={ownerUser}>
                <ConsumerComponent />
            </AuthProvider>,
        );
        expect(screen.getByTestId('owner').textContent).toBe('true');
    });

    it('provides isOwner=false for USER role', () => {
        render(
            <AuthProvider initialUser={regularUser}>
                <ConsumerComponent />
            </AuthProvider>,
        );
        expect(screen.getByTestId('owner').textContent).toBe('false');
    });
});

describe('useAuth', () => {
    it('throws when used outside AuthProvider', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => render(<ConsumerComponent />)).toThrow(
            'useAuth must be used within an AuthProvider',
        );
        spy.mockRestore();
    });
});