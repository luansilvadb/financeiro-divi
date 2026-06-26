import { Test, TestingModule } from '@nestjs/testing';
import { LancamentoService } from './lancamento.service';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceiroGateway } from './financeiro.gateway';
import { AuditLogService } from './audit-log.service';
import { ProductValidationService } from './product-validation.service';
import { SplitMode, ValidationEventType } from '@prisma/client';
import { PermissaoService } from './permissao.service';

describe('LancamentoService', () => {
  let service: LancamentoService;
  let prisma: PrismaService;

  const mockPrisma = {
    $transaction: jest.fn((fn) => fn(mockPrisma)),
    gasto: {
      upsert: jest.fn().mockResolvedValue({ id: 'g1' }),
      findUnique: jest.fn().mockResolvedValue({ id: 'g1', compradorId: 'm1', valorTotalCentavos: 100n, divisoes: [] }),
    },
    divisaoGasto: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    membroCasa: {
      findFirst: jest.fn().mockResolvedValue({ id: 'm1', nome: 'Membro Teste' }),
      findUnique: jest.fn().mockResolvedValue({ id: 'm1', nome: 'Membro Teste' }),
      count: jest.fn().mockResolvedValue(2),
    },
    fatura: {
      findUnique: jest.fn().mockResolvedValue({ id: 'f1', cartaoId: 'c1' }),
    },
    cartao: {
      findUnique: jest.fn().mockResolvedValue({ id: 'c1', responsavelPadraoId: 'm1' }),
    }
  };

  const mockGateway = {
    notificarAlteracao: jest.fn(),
  };
  const mockAuditLog = {
    registrar: jest.fn().mockResolvedValue({}),
    listar: jest.fn().mockResolvedValue([]),
  };
  const mockProductValidation = {
    registrarMarco: jest.fn().mockResolvedValue(undefined),
  };
  const mockPermissao = {
    validarFeatureFlag: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LancamentoService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FinanceiroGateway, useValue: mockGateway },
        { provide: AuditLogService, useValue: mockAuditLog },
        { provide: ProductValidationService, useValue: mockProductValidation },
        { provide: PermissaoService, useValue: mockPermissao },
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
        divisoes: [{ membroId: 'm1', valorCentavos: 100 }]
      };

      await service.salvarGasto('t1', g as any);

      expect(prisma.gasto.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ isLoan: false, isSettlement: false }),
          update: expect.objectContaining({ isLoan: false, isSettlement: false }),
        })
      );
    });

    it('registra a primeira despesa nova com metadata sem dados financeiros', async () => {
      mockPrisma.gasto.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'g-novo', divisoes: [] });
      const g = {
        id: 'g-novo', descricao: 'Teste', valorTotalCentavos: 100,
        compradorId: 'm1', installments: 1, totalInstallments: 1, method: 'pix',
        isLoan: false, isSettlement: false, splitMode: SplitMode.EQUAL,
        divisoes: [{ membroId: 'm1', valorCentavos: 100 }],
      };

      await service.salvarGasto('t1', g as any);

      expect(mockProductValidation.registrarMarco).toHaveBeenCalledWith(
        't1',
        ValidationEventType.FIRST_EXPENSE_CREATED,
        'first',
        { metadata: {
          splitMode: SplitMode.EQUAL,
          paymentMethod: 'pix',
          participantCount: 1,
          installmentCount: 1,
          isRecurringBill: false,
        } },
        mockPrisma,
      );
    });
  });

  describe('salvarGasto - Empréstimo', () => {
    it('deve salvar um empréstimo forçando isLoan como true e isSettlement como false', async () => {
      const g = {
        id: 'g1', faturaId: 'f1', descricao: 'Emprestimo', valorTotalCentavos: 500,
        compradorId: 'm1', installments: 1, totalInstallments: 1, method: 'pix',
        isLoan: true, borrowerId: 'm2', divisoes: [{ membroId: 'm2', valorCentavos: 500 }]
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
        id: 'g1', descricao: 'Acerto', valorTotalCentavos: 300,
        compradorId: 'm1', installments: 1, totalInstallments: 1, method: 'pix',
        isSettlement: true,
        settlementDetails: { fromMemberId: 'm1', toMemberId: 'm2', method: 'pix' },
        divisoes: [{ membroId: 'm2', valorCentavos: 300 }]
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
