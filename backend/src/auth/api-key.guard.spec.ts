import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from './api-key.guard';

function makeConfigService(values: Record<string, string>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

function makeContext(headers: Record<string, string> = {}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as unknown as ExecutionContext;
}

describe('ApiKeyGuard', () => {
  describe('when API_KEY is configured', () => {
    let guard: ApiKeyGuard;

    beforeEach(() => {
      guard = new ApiKeyGuard(
        makeConfigService({ API_KEY: 'secret-key', NODE_ENV: 'production' }),
      );
    });

    it('returns true when x-api-key header matches configured key', () => {
      const ctx = makeContext({ 'x-api-key': 'secret-key' });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('throws UnauthorizedException when x-api-key header is missing', () => {
      const ctx = makeContext({});
      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when x-api-key header is wrong', () => {
      const ctx = makeContext({ 'x-api-key': 'wrong-key' });
      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });
  });

  describe('when API_KEY is not configured', () => {
    it('throws UnauthorizedException in production', () => {
      const guard = new ApiKeyGuard(
        makeConfigService({ API_KEY: '', NODE_ENV: 'production' }),
      );
      const ctx = makeContext({});
      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    it('returns true in development (backwards compatibility)', () => {
      const guard = new ApiKeyGuard(
        makeConfigService({ API_KEY: '', NODE_ENV: 'development' }),
      );
      const ctx = makeContext({});
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('defaults to development when NODE_ENV is not set', () => {
      const guard = new ApiKeyGuard(
        makeConfigService({ API_KEY: '' }),
      );
      const ctx = makeContext({});
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });
});
