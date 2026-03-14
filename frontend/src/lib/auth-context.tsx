'use client';

import React, { createContext, useContext } from 'react';

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: 'OWNER' | 'USER';
    companyId: string;
    companyName: string;
}

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isOwner: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
    initialUser,
    children,
}: {
    initialUser: AuthUser | null;
    children: React.ReactNode;
}) {
    return (
        <AuthContext.Provider
            value={{
                user: initialUser,
                isAuthenticated: !!initialUser,
                isOwner: initialUser?.role === 'OWNER',
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}