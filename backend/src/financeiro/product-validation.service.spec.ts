import { ValidationEventType } from '@prisma/client';
import { ProductValidationService } from './product-validation.service';

describe('ProductValidationService', () => {
  const prisma = {
    productValidationEvent: {
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
      findMany: jest.fn(),
    },
    membroCasa: { count: jest.fn() },
    fatura: { findMany: jest.fn() },
    tenant: { findUnique: jest.fn() },
  };
  let service: ProductValidationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductValidationService(prisma as any);
  });

  it('converge chamadas concorrentes sem sobrescrever o evento original', async () => {
    prisma.productValidationEvent.createMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    await Promise.all([
      service.registrarMarco('t1', ValidationEventType.FIRST_EXPENSE_CREATED, 'first'),
      service.registrarMarco('t1', ValidationEventType.FIRST_EXPENSE_CREATED, 'first'),
    ]);

    expect(prisma.productValidationEvent.createMany).toHaveBeenCalledTimes(2);
    expect(prisma.productValidationEvent.createMany).toHaveBeenLastCalledWith({
      data: [{
        tenantId: 't1',
        type: ValidationEventType.FIRST_EXPENSE_CREATED,
        dedupeKey: 'first',
        periodKey: undefined,
        metadata: undefined,
      }],
      skipDuplicates: true,
    });
  });

  it('rejeita metadata fora da allowlist em desenvolvimento', async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    await expect(service.registrarMarco(
      't1',
      ValidationEventType.FIRST_EXPENSE_CREATED,
      'first',
      { metadata: { description: 'privado' } as any },
    )).rejects.toThrow('Metadata de validação não permitida');

    process.env.NODE_ENV = previous;
  });

  it('só registra período quando todas as faturas persistidas estão fechadas', async () => {
    prisma.fatura.findMany.mockResolvedValueOnce([{ status: 'FECHADA' }, { status: 'ABERTA' }]);
    await service.registrarPeriodoFechadoSeConsolidado('t1', 5, 2026);
    expect(prisma.productValidationEvent.createMany).not.toHaveBeenCalled();

    prisma.fatura.findMany.mockResolvedValueOnce([{ status: 'FECHADA' }, { status: 'FECHADA' }]);
    await service.registrarPeriodoFechadoSeConsolidado('t1', 5, 2026);
    expect(prisma.productValidationEvent.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ periodKey: '2026-05' })],
      skipDuplicates: true,
    });
  });

  it('deriva ativação e repetição apenas dos eventos do tenant consultado', async () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    prisma.tenant.findUnique.mockResolvedValue({ createdAt });
    prisma.productValidationEvent.findMany.mockResolvedValue([
      { type: ValidationEventType.SECOND_LINKED_MEMBER_JOINED, createdAt: new Date('2026-01-02'), periodKey: null },
      { type: ValidationEventType.FIRST_EXPENSE_CREATED, createdAt: new Date('2026-01-03'), periodKey: null },
      { type: ValidationEventType.PERIOD_CLOSED, createdAt: new Date('2026-02-01'), periodKey: '2026-02' },
      { type: ValidationEventType.PERIOD_CLOSED, createdAt: new Date('2026-03-01'), periodKey: '2026-03' },
      { type: ValidationEventType.PERIOD_CLOSED, createdAt: new Date('2026-04-01'), periodKey: 'inválido' },
    ]);

    const result = await service.obterStatus('t1');

    expect(prisma.productValidationEvent.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: 't1' } }));
    expect(result.closedPeriods).toEqual(['2026-02', '2026-03']);
    expect(result.activationComplete).toBe(true);
    expect(result.repeatedValue).toBe(true);
  });
});
