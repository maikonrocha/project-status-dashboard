import { type ExecutionContext } from '@nestjs/common';
import { type Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from './roles.decorator';

function makeContext(
  user: unknown = undefined,
  _requiredRoles: string[] | undefined = undefined,
): ExecutionContext {
  const handler = {};
  const cls = {};

  return {
    getHandler: () => handler,
    getClass: () => cls,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getArgs: () => [],
    getArgByIndex: () => null,
    switchToRpc: () => ({}),
    switchToWs: () => ({}),
    getType: () => 'http',
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: jest.Mocked<Reflector>;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles are required (no @Roles() decorator)', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(undefined);
    const context = makeContext({ role: 'USER' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access when required roles array is empty', () => {
    reflector.getAllAndOverride.mockReturnValueOnce([]);
    const context = makeContext({ role: 'USER' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies access when no user is present on the request', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(['OWNER']);
    const context = makeContext(undefined); // no user
    expect(guard.canActivate(context)).toBe(false);
  });

  it('allows access when user role matches the required role', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(['OWNER']);
    const context = makeContext({ role: 'OWNER' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies access when user role does not match the required role', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(['OWNER']);
    const context = makeContext({ role: 'USER' });
    expect(guard.canActivate(context)).toBe(false);
  });

  it('allows access when user role is one of multiple required roles', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(['OWNER', 'ADMIN']);
    const context = makeContext({ role: 'ADMIN' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('reads metadata using ROLES_KEY from both handler and class', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(['OWNER']);
    const context = makeContext({ role: 'OWNER' });

    guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });
});
