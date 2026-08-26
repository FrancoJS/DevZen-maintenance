import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/enums/user-role.enum';
import { RolesGuard } from './roles.guard';

function createContext(role?: UserRole): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { id: 'user-id', role } : undefined }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
  const guard = new RolesGuard(reflector as unknown as Reflector);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('allows an authenticated endpoint without a role restriction', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createContext(UserRole.REQUESTER))).toBe(true);
  });

  it('allows a user with an accepted role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(guard.canActivate(createContext(UserRole.ADMIN))).toBe(true);
  });

  it('allows one of several accepted roles', () => {
    reflector.getAllAndOverride.mockReturnValue([
      UserRole.TECHNICIAN,
      UserRole.ADMIN,
    ]);

    expect(guard.canActivate(createContext(UserRole.TECHNICIAN))).toBe(true);
  });

  it('rejects a user whose role is not accepted', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(guard.canActivate(createContext(UserRole.REQUESTER))).toBe(false);
  });
});
