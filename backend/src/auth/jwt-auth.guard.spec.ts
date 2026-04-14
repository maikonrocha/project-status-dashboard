import { type ExecutionContext } from '@nestjs/common';
import { type Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from './public.decorator';

// Helper: build a minimal ExecutionContext mock
function makeContext(
  _handlerMeta: unknown = undefined,
  _classMeta: unknown = undefined,
): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({}),
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
    getArgs: () => [],
    getArgByIndex: () => null,
    switchToRpc: () => ({}),
    switchToWs: () => ({}),
    getType: () => 'http',
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let reflector: jest.Mocked<Reflector>;
  let guard: JwtAuthGuard;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new JwtAuthGuard(reflector);
  });

  it('returns true immediately for @Public() routes without calling super.canActivate', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(true); // isPublic = true

    const context = makeContext();
    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });

  it('calls super.canActivate for non-public routes', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false); // isPublic = false

    // Spy on the parent AuthGuard's canActivate
    const superCanActivate = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValueOnce(true);

    const context = makeContext();
    const result = guard.canActivate(context);

    expect(superCanActivate).toHaveBeenCalledWith(context);
    expect(result).toBe(true);

    superCanActivate.mockRestore();
  });

  it('calls super.canActivate when @Public() metadata is absent (undefined)', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(undefined); // not decorated

    const superCanActivate = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValueOnce(false);

    const context = makeContext();
    void guard.canActivate(context);

    expect(superCanActivate).toHaveBeenCalled();
    superCanActivate.mockRestore();
  });
});
