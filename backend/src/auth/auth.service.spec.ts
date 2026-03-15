import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { type JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { type PrismaService } from '../prisma/prisma.service';
import { type MailService } from './mail.service';

// Mock bcrypt at module level — native bindings can't be spied on with jest.spyOn
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$mocked-hash'),
  compare: jest.fn().mockResolvedValue(true),
}));

import * as bcrypt from 'bcrypt';
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// ─── Mock factories ───────────────────────────────────────────────────────────

function makePrisma(): jest.Mocked<PrismaService> {
  return {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    company: {
      create: jest.fn(),
    },
    verificationCode: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  } as unknown as jest.Mocked<PrismaService>;
}

function makeJwt(): jest.Mocked<JwtService> {
  return {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  } as unknown as jest.Mocked<JwtService>;
}

function makeMail(): jest.Mocked<MailService> {
  return {
    sendVerificationCode: jest.fn().mockResolvedValue(undefined),
    sendInviteEmail: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<MailService>;
}

// Reusable user/company fixtures
const COMPANY = { id: 'company-uuid', name: 'Acme Corp' };
const OWNER_USER = {
  id: 'user-uuid',
  email: 'owner@acme.com',
  name: 'Owner',
  passwordHash: '$2b$12$hashedpassword',
  role: 'OWNER',
  isVerified: true,
  isActive: true,
  companyId: COMPANY.id,
  company: COMPANY,
};
const REGULAR_USER = { ...OWNER_USER, id: 'user2-uuid', role: 'USER' };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwt: jest.Mocked<JwtService>;
  let mail: jest.Mocked<MailService>;

  beforeEach(() => {
    prisma = makePrisma();
    jwt = makeJwt();
    mail = makeMail();
    service = new AuthService(prisma, jwt, mail);
  });

  // ─── signUpOwner ──────────────────────────────────────────────────────────

  describe('signUpOwner', () => {
    it('creates company, user and returns userId + email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prisma.company.create as jest.Mock).mockResolvedValueOnce(COMPANY);
      (prisma.user.create as jest.Mock).mockResolvedValueOnce(OWNER_USER);
      (prisma.verificationCode.updateMany as jest.Mock).mockResolvedValueOnce(
        {},
      );
      (prisma.verificationCode.create as jest.Mock).mockResolvedValueOnce({});

      const result = await service.signUpOwner(
        'Owner',
        'owner@acme.com',
        'pass123',
        'Acme Corp',
      );

      expect(prisma.company.create).toHaveBeenCalledWith({
        data: { name: 'Acme Corp' },
      });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(mail.sendVerificationCode).toHaveBeenCalled();
      expect(result.userId).toBe(OWNER_USER.id);
      expect(result.email).toBe(OWNER_USER.email);
      expect(result.message).toMatch(/verify/i);
    });

    it('throws ConflictException when email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(OWNER_USER);

      await expect(
        service.signUpOwner('Owner', 'owner@acme.com', 'pass123', 'Acme Corp'),
      ).rejects.toThrow(ConflictException);
    });

    it('hashes the password with bcrypt before storing', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prisma.company.create as jest.Mock).mockResolvedValueOnce(COMPANY);
      (prisma.user.create as jest.Mock).mockResolvedValueOnce(OWNER_USER);
      (prisma.verificationCode.updateMany as jest.Mock).mockResolvedValueOnce(
        {},
      );
      (prisma.verificationCode.create as jest.Mock).mockResolvedValueOnce({});

      await service.signUpOwner(
        'Owner',
        'owner@acme.com',
        'pass123',
        'Acme Corp',
      );

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('pass123', 12);
    });
  });

  // ─── completeSignUp ───────────────────────────────────────────────────────

  describe('completeSignUp', () => {
    it('updates password and sends verification code', async () => {
      const invitedUser = {
        ...REGULAR_USER,
        passwordHash: null,
        isVerified: false,
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(invitedUser);
      (prisma.user.update as jest.Mock).mockResolvedValueOnce(invitedUser);
      (prisma.verificationCode.updateMany as jest.Mock).mockResolvedValueOnce(
        {},
      );
      (prisma.verificationCode.create as jest.Mock).mockResolvedValueOnce({});

      const result = await service.completeSignUp(
        'user2@acme.com',
        'New Name',
        'newpass',
      );

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: 'user2@acme.com' } }),
      );
      expect(mail.sendVerificationCode).toHaveBeenCalled();
      expect(result.message).toMatch(/verify/i);
    });

    it('throws NotFoundException when invited user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.completeSignUp('nobody@acme.com', 'Name', 'pass'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when user already has a password (account already set up)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(OWNER_USER); // has passwordHash

      await expect(
        service.completeSignUp('owner@acme.com', 'Owner', 'pass'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── signIn ───────────────────────────────────────────────────────────────

  describe('signIn', () => {
    it('returns accessToken and user data for valid verified credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(OWNER_USER);
      mockedBcrypt.compare.mockResolvedValueOnce(true as never);

      const result = await service.signIn('owner@acme.com', 'pass123');

      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect((result as { user: { email: string } }).user.email).toBe(
        'owner@acme.com',
      );
    });

    it('throws UnauthorizedException when user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.signIn('nobody@acme.com', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when user has no passwordHash', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        ...OWNER_USER,
        passwordHash: null,
      });

      await expect(service.signIn('owner@acme.com', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when account is inactive', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        ...OWNER_USER,
        isActive: false,
      });

      await expect(service.signIn('owner@acme.com', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(OWNER_USER);
      mockedBcrypt.compare.mockResolvedValueOnce(false as never);

      await expect(
        service.signIn('owner@acme.com', 'wrongpass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns requiresVerification and resends code when user is not verified', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        ...OWNER_USER,
        isVerified: false,
      });
      mockedBcrypt.compare.mockResolvedValueOnce(true as never);
      (prisma.verificationCode.updateMany as jest.Mock).mockResolvedValueOnce(
        {},
      );
      (prisma.verificationCode.create as jest.Mock).mockResolvedValueOnce({});

      const result = await service.signIn('owner@acme.com', 'pass123');

      expect(
        (result as { requiresVerification: boolean }).requiresVerification,
      ).toBe(true);
      expect(mail.sendVerificationCode).toHaveBeenCalled();
    });
  });

  // ─── verifyCode ───────────────────────────────────────────────────────────

  describe('verifyCode', () => {
    const VALID_CODE_RECORD = {
      id: 'code-uuid',
      email: 'owner@acme.com',
      code: '123456',
      used: false,
      expiresAt: new Date(Date.now() + 60_000),
    };

    it('marks code as used, marks user as verified, returns accessToken', async () => {
      (prisma.verificationCode.findFirst as jest.Mock).mockResolvedValueOnce(
        VALID_CODE_RECORD,
      );
      (prisma.verificationCode.update as jest.Mock).mockResolvedValueOnce({});
      (prisma.user.update as jest.Mock).mockResolvedValueOnce(OWNER_USER);

      const result = await service.verifyCode('owner@acme.com', '123456');

      expect(prisma.verificationCode.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { used: true } }),
      );
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isVerified: true } }),
      );
      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
    });

    it('throws BadRequestException when code is invalid or expired', async () => {
      (prisma.verificationCode.findFirst as jest.Mock).mockResolvedValueOnce(
        null,
      );

      await expect(
        service.verifyCode('owner@acme.com', '000000'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── resendCode ───────────────────────────────────────────────────────────

  describe('resendCode', () => {
    it('generates and sends a new code for unverified user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        ...OWNER_USER,
        isVerified: false,
      });
      (prisma.verificationCode.updateMany as jest.Mock).mockResolvedValueOnce(
        {},
      );
      (prisma.verificationCode.create as jest.Mock).mockResolvedValueOnce({});

      const result = await service.resendCode('owner@acme.com');

      expect(mail.sendVerificationCode).toHaveBeenCalled();
      expect(result.message).toMatch(/code/i);
    });

    it('throws NotFoundException when user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.resendCode('nobody@acme.com')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when user is already verified', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(OWNER_USER); // isVerified: true

      await expect(service.resendCode('owner@acme.com')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── inviteUser ───────────────────────────────────────────────────────────

  describe('inviteUser', () => {
    it('creates skeleton user and sends invite email', async () => {
      // owner lookup
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(OWNER_USER);
      // invited email does not exist yet
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prisma.user.create as jest.Mock).mockResolvedValueOnce({
        ...REGULAR_USER,
        id: 'new-uuid',
      });

      const result = await service.inviteUser(OWNER_USER.id, 'new@acme.com');

      expect(prisma.user.create).toHaveBeenCalled();
      expect(mail.sendInviteEmail).toHaveBeenCalledWith(
        'new@acme.com',
        COMPANY.name,
        'mock-jwt-token',
      );
      expect(result.message).toMatch(/new@acme.com/);
    });

    it('throws UnauthorizedException when the invoker is not an OWNER', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(REGULAR_USER); // role: USER

      await expect(
        service.inviteUser(REGULAR_USER.id, 'new@acme.com'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws ConflictException when invited email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(OWNER_USER); // owner
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(REGULAR_USER); // existing email

      await expect(
        service.inviteUser(OWNER_USER.id, 'owner@acme.com'),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── getMe ────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('returns user profile for a valid userId', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(OWNER_USER);

      const result = await service.getMe(OWNER_USER.id);

      expect(result.id).toBe(OWNER_USER.id);
      expect(result.email).toBe(OWNER_USER.email);
      expect(result.companyName).toBe(COMPANY.name);
    });

    it('throws NotFoundException when userId does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.getMe('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── getCompanyUsers ──────────────────────────────────────────────────────

  describe('getCompanyUsers', () => {
    it('returns list of users for a company', async () => {
      const users = [OWNER_USER, REGULAR_USER];
      (prisma.user.findMany as jest.Mock).mockResolvedValueOnce(users);

      const result = await service.getCompanyUsers(COMPANY.id);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { companyId: COMPANY.id } }),
      );
      expect(result).toHaveLength(2);
    });

    it('returns empty array when company has no users', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValueOnce([]);

      const result = await service.getCompanyUsers(COMPANY.id);
      expect(result).toEqual([]);
    });
  });
});
