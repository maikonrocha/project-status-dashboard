import { ConfigService } from '@nestjs/config';

// Mock passport-jwt and @nestjs/passport before importing JwtStrategy
// so the super() constructor call does not attempt real JWT setup.
jest.mock('passport-jwt', () => ({
  ExtractJwt: {
    fromAuthHeaderAsBearerToken: jest.fn().mockReturnValue(() => null),
  },
  Strategy: class MockStrategy {
    constructor(_opts: unknown) {}
  },
}));

jest.mock('@nestjs/passport', () => ({
  PassportStrategy: (Base: new (...args: unknown[]) => unknown) =>
    class extends (Base as any) {
      constructor(...args: unknown[]) {
        super(...args);
      }
    },
}));

import { JwtStrategy, JwtPayload } from './jwt.strategy';

function makeConfigService(secret = 'test-secret'): ConfigService {
  return {
    get: (_key: string) => secret,
  } as unknown as ConfigService;
}

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy(makeConfigService());
  });

  describe('validate', () => {
    it('returns a user object mapped from the JWT payload', () => {
      const payload: JwtPayload = {
        sub: 'user-uuid',
        email: 'alice@test.com',
        role: 'OWNER',
        companyId: 'company-uuid',
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        id: 'user-uuid',
        email: 'alice@test.com',
        role: 'OWNER',
        companyId: 'company-uuid',
      });
    });

    it('maps sub to id', () => {
      const payload: JwtPayload = {
        sub: 'specific-id',
        email: 'x@x.com',
        role: 'USER',
        companyId: 'comp',
      };

      const result = strategy.validate(payload);

      expect(result.id).toBe('specific-id');
    });

    it('preserves all payload fields', () => {
      const payload: JwtPayload = {
        sub: 'u1',
        email: 'b@b.com',
        role: 'USER',
        companyId: 'c1',
      };

      const result = strategy.validate(payload);

      expect(result.email).toBe(payload.email);
      expect(result.role).toBe(payload.role);
      expect(result.companyId).toBe(payload.companyId);
    });
  });
});
