import { CartaoService } from './cartao.service';

describe('CartaoService validation milestones', () => {
  const prisma = {
    fatura: { upsert: jest.fn().mockResolvedValue({ id: 'f1' }) },
    $transaction: jest.fn(async (operations) => Promise.all(operations)),
  };
  const gateway = { notificarAlteracao: jest.fn() };
  const validation = { registrarPeriodoFechadoSeConsolidado: jest.fn().mockResolvedValue(undefined) };
  let service: CartaoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CartaoService(prisma as any, gateway as any, validation as any);
  });

  it('verifica consolidação depois de fechar uma fatura', async () => {
    await service.salvarFatura('t1', {
      id: 'f1', cartaoId: 'c1', mes: 5, ano: 2026, responsavelId: 'm1', status: 'FECHADA',
    } as any);

    expect(validation.registrarPeriodoFechadoSeConsolidado).toHaveBeenCalledWith('t1', 5, 2026);
  });

  it('deduplica períodos fechados no batch e ignora períodos abertos', async () => {
    await service.salvarMuitasFaturas('t1', [
      { id: 'f1', cartaoId: 'c1', mes: 5, ano: 2026, responsavelId: 'm1', status: 'FECHADA' },
      { id: 'f2', cartaoId: 'c2', mes: 5, ano: 2026, responsavelId: 'm2', status: 'FECHADA' },
      { id: 'f3', cartaoId: 'c1', mes: 6, ano: 2026, responsavelId: 'm1', status: 'ABERTA' },
    ] as any);

    expect(validation.registrarPeriodoFechadoSeConsolidado).toHaveBeenCalledTimes(1);
    expect(validation.registrarPeriodoFechadoSeConsolidado).toHaveBeenCalledWith('t1', 5, 2026);
  });
});
