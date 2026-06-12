import { TenantRoleGuard } from './tenant-role.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

const mockPrisma = {
  membroCasa: {
    findFirst: jest.fn(),
  },
};

function makeContext(roles: Role[] | null, user: any, tenantId = 't1'): ExecutionContext {
  const reflector = { getAllAndOverride: jest.fn(() => roles) } as any;
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user, headers: { 'x-tenant-id': tenantId } }),
    }),
    _reflector: reflector,
  } as any;
}

describe('TenantRoleGuard', () => {
  let guard: TenantRoleGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new TenantRoleGuard(reflector, mockPrisma as any);
    jest.clearAllMocks();
  });

  const user = { userId: 'u1' };

  function setupMembro(overrides: Partial<{ role: Role }>) {
    mockPrisma.membroCasa.findFirst.mockResolvedValue({
      role: Role.MORADOR,
      ...overrides,
    });
  }

  it('sem @Roles: deve passar', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const ctx = makeContext(null, user);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(mockPrisma.membroCasa.findFirst).not.toHaveBeenCalled();
  });

  it('@Roles(ADMIN) + membro MORADOR: deve rejeitar 403', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    setupMembro({ role: Role.MORADOR });
    const ctx = makeContext([Role.ADMIN], user);
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('@Roles(ADMIN) + membro ADMIN: deve passar', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    setupMembro({ role: Role.ADMIN });
    const ctx = makeContext([Role.ADMIN], user);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
});
