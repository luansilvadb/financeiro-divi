import { Test, TestingModule } from '@nestjs/testing';
import { FinanceiroService } from './financeiro.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { FinanceiroGateway } from './financeiro.gateway';

describe('FinanceiroService', () => {
  let service: FinanceiroService;
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

  const mockAuth = {};
  const mockGateway = {
    notificarAlteracao: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceiroService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuthService, useValue: mockAuth },
        { provide: FinanceiroGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<FinanceiroService>(FinanceiroService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('salvarMuitosGastos', () => {
    it('should save multiple gastos in parallel', async () => {
      const tenantId = 'tenant-1';
      const gastosList = [
        { id: 'g1', descricao: 'Gasto 1', valorTotalCentavos: 1000 },
        { id: 'g2', descricao: 'Gasto 2', valorTotalCentavos: 2000 },
      ];

      const result = await service.salvarMuitosGastos(tenantId, gastosList);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.gasto.upsert).toHaveBeenCalledTimes(2);
      expect(mockGateway.notificarAlteracao).toHaveBeenCalledWith(tenantId, 'gastos_alterados');
      expect(result).toHaveLength(2);
    });
  });
});
