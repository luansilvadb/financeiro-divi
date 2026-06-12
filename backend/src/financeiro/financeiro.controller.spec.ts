import { Role } from '@prisma/client';
import { ROLES_KEY } from '../auth/roles.decorator';
import { FinanceiroController } from './financeiro.controller';

describe('FinanceiroController validation status', () => {
  it('é restrito a administradores e delega usando o tenant do cabeçalho', async () => {
    const validation = { obterStatus: jest.fn().mockResolvedValue({ activationComplete: false }) };
    const controller = new FinanceiroController(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      validation as any,
    );

    const roles = Reflect.getMetadata(ROLES_KEY, FinanceiroController.prototype.obterStatusValidacao);
    await expect(controller.obterStatusValidacao('t1')).resolves.toEqual({ activationComplete: false });

    expect(roles).toEqual([Role.ADMIN]);
    expect(validation.obterStatus).toHaveBeenCalledWith('t1');
  });
});
