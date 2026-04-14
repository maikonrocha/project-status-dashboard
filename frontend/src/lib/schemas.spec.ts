import { describe, it, expect } from 'vitest';
import {
  AuthUserSchema,
  SignInResponseSchema,
  VerifyResponseSchema,
  SimpleResponseSchema,
  ProjectSchema,
} from './schemas';

const validUser = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'Test User',
  role: 'OWNER' as const,
  companyId: 'company-1',
  isVerified: true,
  isActive: true,
};

describe('AuthUserSchema', () => {
  it('passes with a valid user object', () => {
    expect(AuthUserSchema.safeParse(validUser).success).toBe(true);
  });

  it('passes with role USER', () => {
    expect(
      AuthUserSchema.safeParse({ ...validUser, role: 'USER' }).success,
    ).toBe(true);
  });

  it('rejects when role is not OWNER or USER', () => {
    expect(
      AuthUserSchema.safeParse({ ...validUser, role: 'ADMIN' }).success,
    ).toBe(false);
  });

  it('rejects when a required field is missing', () => {
    const { id: _id, ...withoutId } = validUser;
    expect(AuthUserSchema.safeParse(withoutId).success).toBe(false);
  });
});

describe('SignInResponseSchema', () => {
  it('passes with only requiresVerification set (all other fields optional)', () => {
    expect(
      SignInResponseSchema.safeParse({ requiresVerification: true }).success,
    ).toBe(true);
  });

  it('passes with accessToken and user (successful login shape)', () => {
    expect(
      SignInResponseSchema.safeParse({ accessToken: 'tok', user: validUser })
        .success,
    ).toBe(true);
  });

  it('passes with an empty object (all fields optional)', () => {
    expect(SignInResponseSchema.safeParse({}).success).toBe(true);
  });
});

describe('VerifyResponseSchema', () => {
  it('passes with valid accessToken and user', () => {
    expect(
      VerifyResponseSchema.safeParse({ accessToken: 'tok', user: validUser })
        .success,
    ).toBe(true);
  });

  it('rejects when accessToken is missing', () => {
    expect(VerifyResponseSchema.safeParse({ user: validUser }).success).toBe(
      false,
    );
  });
});

describe('SimpleResponseSchema', () => {
  it('passes with a message string', () => {
    expect(SimpleResponseSchema.safeParse({ message: 'ok' }).success).toBe(
      true,
    );
  });

  it('passes with an empty object (message is optional)', () => {
    expect(SimpleResponseSchema.safeParse({}).success).toBe(true);
  });

  it('rejects when message is a number', () => {
    expect(SimpleResponseSchema.safeParse({ message: 42 }).success).toBe(false);
  });
});

const validProject = {
  id: 'proj-1',
  epicId: 'MKT-100',
  name: 'Marketing Project',
  squadName: 'Squad A',
  teamSize: 5,
  beginDate: '2025-01-06T00:00:00.000Z',
  jiraBacklogFilterId: '10001',
  jiraThroughputFilterId: '10002',
  statusConfig: { concluded: ['Done'], inProgress: ['In Progress'] },
  companyId: 'company-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('ProjectSchema', () => {
  it('passes with a complete valid project object', () => {
    expect(ProjectSchema.safeParse(validProject).success).toBe(true);
  });

  it('rejects when teamSize is a string instead of number', () => {
    expect(
      ProjectSchema.safeParse({ ...validProject, teamSize: '5' }).success,
    ).toBe(false);
  });

  it('rejects when a required field (epicId) is missing', () => {
    const { epicId: _epicId, ...withoutEpicId } = validProject;
    expect(ProjectSchema.safeParse(withoutEpicId).success).toBe(false);
  });
});
