import { Test, TestingModule } from '@nestjs/testing';
import { LancamentoService } from './lancamento.service';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceiroGateway } from './financeiro.gateway';

describe('LancamentoService', () => {
  let service: LancamentoService;
  let prisma: PrismaService;

  const mockPrisma = {
    $transaction: jest.fn((fn) => fn(mockPrisma)),
    gasto: {
      upsert: jest.fn().mockResolvedValue({ id: 'g1' }),
      findUnique: jest.fn().mockResolvedValue({ id: 'g1', divisoes: [] }),
    },
    divisaoGasto: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };

  const mockGateway = {
    notificarAlteracao: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LancamentoService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FinanceiroGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<LancamentoService>(LancamentoService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('salvarGasto - Despesa Comum', () => {
    it('deve salvar uma despesa comum forçando isLoan e isSettlement como false', async () => {
      const g = {
        id: 'g1', faturaId: 'f1', descricao: 'Teste', valorTotalCentavos: 100,
        compradorId: 'm1', installments: 1, totalInstallments: 1, method: 'pix',
        isLoan: false, isSettlement: false,
        divisoes: []
      };

      await service.salvarGasto('t1', g as any);

      expect(prisma.gasto.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ isLoan: false, isSettlement: false }),
          update: expect.objectContaining({ isLoan: false, isSettlement: false }),
        })
      );
    });
  });

  describe('salvarGasto - Empréstimo', () => {
    it('deve salvar um empréstimo forçando isLoan como true e isSettlement como false', async () => {
      const g = {
        id: 'g1', faturaId: 'f1', descricao: 'Emprestimo', valorTotalCentavos: 500,
        compradorId: 'm1', installments: 1, totalInstallments: 1, method: 'pix',
        isLoan: true, borrowerId: 'm2', divisoes: []
      };

      await service.salvarGasto('t1', g as any);

      expect(prisma.gasto.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ isLoan: true, isSettlement: false }),
          update: expect.objectContaining({ isLoan: true, isSettlement: false }),
        })
      );
    });
  });

  describe('salvarGasto - Acerto', () => {
    it('deve registrar um acerto forçando isSettlement como true e isLoan como false', async () => {
      const g = {
        id: 'g1', faturaId: 'f1', descricao: 'Acerto', valorTotalCentavos: 300,
        compradorId: 'm1', installments: 1, totalInstallments: 1, method: 'pix',
        isSettlement: true, settlementDetails: { from: 'm1', to: 'm2' }, divisoes: []
      };

      await service.salvarGasto('t1', g as any);

      expect(prisma.gasto.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ isLoan: false, isSettlement: true }),
          update: expect.objectContaining({ isLoan: false, isSettlement: true }),
        })
      );
    });
  });
});
