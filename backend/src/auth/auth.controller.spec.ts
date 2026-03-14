import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

// ─── Mock AuthService ─────────────────────────────────────────────────────────

const mockAuthService = {
  signUpOwner: jest.fn(),
  completeSignUp: jest.fn(),
  signIn: jest.fn(),
  verifyCode: jest.fn(),
  resendCode: jest.fn(),
  inviteUser: jest.fn(),
  getMe: jest.fn(),
  getCompanyUsers: jest.fn(),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const REQ_WITH_USER = {
  user: { id: 'user-uuid', companyId: 'company-uuid', role: 'OWNER' },
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  // ─── signUp ───────────────────────────────────────────────────────────────

  describe('signUp', () => {
    it('delegates to authService.signUpOwner with dto fields', async () => {
      const dto = { name: 'Alice', email: 'alice@test.com', password: 'pw', companyName: 'Acme' };
      const expected = { message: 'ok', userId: 'u1', email: dto.email };
      mockAuthService.signUpOwner.mockResolvedValueOnce(expected);

      const result = await controller.signUp(dto as any);

      expect(mockAuthService.signUpOwner).toHaveBeenCalledWith(
        dto.name, dto.email, dto.password, dto.companyName,
      );
      expect(result).toBe(expected);
    });
  });

  // ─── completeSignUp ───────────────────────────────────────────────────────

  describe('completeSignUp', () => {
    it('delegates to authService.completeSignUp', async () => {
      const dto = { email: 'bob@test.com', name: 'Bob', password: 'pw2' };
      const expected = { message: 'done', email: dto.email };
      mockAuthService.completeSignUp.mockResolvedValueOnce(expected);

      const result = await controller.completeSignUp(dto as any);

      expect(mockAuthService.completeSignUp).toHaveBeenCalledWith(
        dto.email, dto.name, dto.password,
      );
      expect(result).toBe(expected);
    });
  });

  // ─── signIn ───────────────────────────────────────────────────────────────

  describe('signIn', () => {
    it('delegates to authService.signIn', async () => {
      const dto = { email: 'alice@test.com', password: 'pw' };
      const expected = { accessToken: 'token', user: {} };
      mockAuthService.signIn.mockResolvedValueOnce(expected);

      const result = await controller.signIn(dto as any);

      expect(mockAuthService.signIn).toHaveBeenCalledWith(dto.email, dto.password);
      expect(result).toBe(expected);
    });
  });

  // ─── verify ───────────────────────────────────────────────────────────────

  describe('verify', () => {
    it('delegates to authService.verifyCode', async () => {
      const dto = { email: 'alice@test.com', code: '123456' };
      const expected = { accessToken: 'token', user: {} };
      mockAuthService.verifyCode.mockResolvedValueOnce(expected);

      const result = await controller.verify(dto as any);

      expect(mockAuthService.verifyCode).toHaveBeenCalledWith(dto.email, dto.code);
      expect(result).toBe(expected);
    });
  });

  // ─── resendCode ───────────────────────────────────────────────────────────

  describe('resendCode', () => {
    it('delegates to authService.resendCode', async () => {
      const dto = { email: 'alice@test.com' };
      const expected = { message: 'sent' };
      mockAuthService.resendCode.mockResolvedValueOnce(expected);

      const result = await controller.resendCode(dto as any);

      expect(mockAuthService.resendCode).toHaveBeenCalledWith(dto.email);
      expect(result).toBe(expected);
    });
  });

  // ─── invite ───────────────────────────────────────────────────────────────

  describe('invite', () => {
    it('delegates to authService.inviteUser using req.user.id', async () => {
      const dto = { email: 'new@test.com' };
      const expected = { message: 'Invitation sent to new@test.com.', userId: 'new-uuid' };
      mockAuthService.inviteUser.mockResolvedValueOnce(expected);

      const result = await controller.invite(REQ_WITH_USER as any, dto as any);

      expect(mockAuthService.inviteUser).toHaveBeenCalledWith(
        REQ_WITH_USER.user.id, dto.email,
      );
      expect(result).toBe(expected);
    });
  });

  // ─── getMe ────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('delegates to authService.getMe using req.user.id', async () => {
      const expected = { id: 'user-uuid', email: 'alice@test.com', name: 'Alice' };
      mockAuthService.getMe.mockResolvedValueOnce(expected);

      const result = await controller.getMe(REQ_WITH_USER as any);

      expect(mockAuthService.getMe).toHaveBeenCalledWith(REQ_WITH_USER.user.id);
      expect(result).toBe(expected);
    });
  });

  // ─── getUsers ─────────────────────────────────────────────────────────────

  describe('getUsers', () => {
    it('delegates to authService.getCompanyUsers using req.user.companyId', async () => {
      const expected = [{ id: 'u1' }, { id: 'u2' }];
      mockAuthService.getCompanyUsers.mockResolvedValueOnce(expected);

      const result = await controller.getUsers(REQ_WITH_USER as any);

      expect(mockAuthService.getCompanyUsers).toHaveBeenCalledWith(REQ_WITH_USER.user.companyId);
      expect(result).toBe(expected);
    });
  });
});
