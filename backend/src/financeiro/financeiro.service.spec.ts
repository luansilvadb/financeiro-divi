import { Test, TestingModule } from '@nestjs/testing';
import { FinanceiroService } from './financeiro.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { FinanceiroGateway } from './financeiro.gateway';
import { Role } from '@prisma/client';

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
    membroCasa: {
      findUnique: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn().mockResolvedValue({ id: 'm1', role: 'ADMIN', ativo: true }),
      create: jest.fn().mockResolvedValue({ id: 'm1', role: 'ADMIN', ativo: true }),
      findFirst: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn(),
    },
    tenant: {
      create: jest.fn().mockResolvedValue({ id: 't1', name: 'Casa Teste', inviteCode: 'CASA-TESTE' }),
    },
    usuario: {
      findUnique: jest.fn().mockResolvedValue({ id: 'u1', username: 'luan' }),
    },
    cargoCasa: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockAuth = {
    register: jest.fn().mockResolvedValue({ userId: 'user-new' }),
  };
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

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('salvarMuitosGastos', () => {
    it('should save multiple gastos in parallel', async () => {
      const tenantId = 'tenant-1';
      const gastosList = [
        {
          id: 'g1', faturaId: 'f1', descricao: 'Gasto 1', valorTotalCentavos: 1000,
          compradorId: 'm1', installments: 1, totalInstallments: 1, isLoan: false,
          isSettlement: false, method: 'pix', divisoes: [],
        },
        {
          id: 'g2', faturaId: 'f1', descricao: 'Gasto 2', valorTotalCentavos: 2000,
          compradorId: 'm1', installments: 1, totalInstallments: 1, isLoan: false,
          isSettlement: false, method: 'pix', divisoes: [],
        },
      ];

      const result = await service.salvarMuitosGastos(tenantId, gastosList);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.gasto.upsert).toHaveBeenCalledTimes(2);
      expect(mockGateway.notificarAlteracao).toHaveBeenCalledWith(tenantId, 'gastos_alterados');
      expect(result).toHaveLength(2);
    });
  });

  describe('criarTenant', () => {
    it('deve criar tenant e definir o criador como ADMIN', async () => {
      const result = await service.criarTenant('Minha Casa', 'u1');
      expect(prisma.tenant.create).toHaveBeenCalledWith({
        data: { name: 'Minha Casa', inviteCode: expect.any(String) }
      });
      expect(prisma.membroCasa.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'u1',
          role: Role.ADMIN
        })
      });
      expect(result).toBeDefined();
    });
  });

  describe('salvarMembro - Regras de RBAC e último Admin', () => {
    it('deve salvar um membro comum se fornecer usuário e senha', async () => {
      jest.spyOn(prisma.membroCasa, 'findUnique').mockResolvedValue(null);
      const data = { 
        id: 'm1', 
        nome: 'Luan', 
        ativo: true, 
        role: Role.MORADOR,
        username: 'luan.novo',
        password: 'senha_secreta'
      };
      const result = await service.salvarMembro('t1', data);
      expect(prisma.membroCasa.upsert).toHaveBeenCalled();
      expect(mockAuth.register).toHaveBeenCalledWith('luan.novo', 'Luan', 'senha_secreta');
      expect(result).toBeDefined();
    });

    it('deve rejeitar a criação de membro se não fornecer usuário e senha', async () => {
      jest.spyOn(prisma.membroCasa, 'findUnique').mockResolvedValue(null);
      const data = { id: 'm1', nome: 'Luan', ativo: true, role: Role.MORADOR };
      await expect(service.salvarMembro('t1', data)).rejects.toThrow(
        'Usuário e senha são obrigatórios para a criação de um novo morador.'
      );
    });

    it('deve impedir a desativação se for o único administrador ativo', async () => {
      jest.spyOn(prisma.membroCasa, 'findUnique').mockResolvedValue({
        id: 'm1',
        nome: 'Admin Unico',
        role: Role.ADMIN,
        ativo: true,
        tenantId: 't1',
        createdAt: new Date(),
        userId: 'u1',
        avatar: 'AU'
      } as any);

      jest.spyOn(prisma.membroCasa, 'count').mockResolvedValue(1);

      const data = { id: 'm1', nome: 'Admin Unico', ativo: false, role: Role.ADMIN };
      await expect(service.salvarMembro('t1', data)).rejects.toThrow(
        'A moradia precisa ter pelo menos um administrador ativo.'
      );
    });

    it('deve impedir a mudança de cargo para MORADOR se for o único administrador ativo', async () => {
      jest.spyOn(prisma.membroCasa, 'findUnique').mockResolvedValue({
        id: 'm1',
        nome: 'Admin Unico',
        role: Role.ADMIN,
        ativo: true,
        tenantId: 't1',
        createdAt: new Date(),
        userId: 'u1',
        avatar: 'AU'
      } as any);

      jest.spyOn(prisma.membroCasa, 'count').mockResolvedValue(1);

      const data = { id: 'm1', nome: 'Admin Unico', ativo: true, role: Role.MORADOR };
      await expect(service.salvarMembro('t1', data)).rejects.toThrow(
        'A moradia precisa ter pelo menos um administrador ativo.'
      );
    });

    it('deve limpar o cargoId se o membro for promovido a ADMIN', async () => {
      jest.spyOn(prisma.membroCasa, 'findUnique').mockResolvedValue({
        id: 'm1',
        nome: 'Membro',
        role: Role.MORADOR,
        ativo: true,
      } as any);

      await service.salvarMembro('t1', {
        id: 'm1',
        nome: 'Membro',
        role: Role.ADMIN,
        cargoId: 'cargo-1',
      });

      expect(prisma.membroCasa.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            role: Role.ADMIN,
            cargoId: null,
          }),
          update: expect.objectContaining({
            role: Role.ADMIN,
            cargoId: null,
          }),
        })
      );
    });
  });

  describe('Cargos Dinâmicos', () => {
    it('deve listar cargos com contagem de membros', async () => {
      const mockCargos = [
        { id: 'c1', nome: 'Financeiro', cor: '#fff', permissoes: ['gastos'], _count: { membros: 2 } },
      ];
      jest.spyOn(prisma.cargoCasa, 'findMany').mockResolvedValue(mockCargos as any);

      const result = await service.listarCargos('t1');
      expect(prisma.cargoCasa.findMany).toHaveBeenCalledWith({
        where: { tenantId: 't1' },
        include: { _count: { select: { membros: true } } },
      });
      expect(result).toEqual(mockCargos);
    });

    it('deve salvar ou atualizar um cargo', async () => {
      const cargoData = { id: 'c1', nome: 'Financeiro', cor: '#fff', permissoes: ['gastos'] };
      jest.spyOn(prisma.cargoCasa, 'upsert').mockResolvedValue(cargoData as any);

      const result = await service.salvarCargo('t1', cargoData);
      expect(prisma.cargoCasa.upsert).toHaveBeenCalledWith({
        where: { id_tenantId: { id: 'c1', tenantId: 't1' } },
        create: expect.objectContaining({ nome: 'Financeiro' }),
        update: expect.objectContaining({ nome: 'Financeiro' }),
      });
      expect(result).toEqual(cargoData);
      expect(mockGateway.notificarAlteracao).toHaveBeenCalledWith('t1', 'cargos_alterados');
    });

    it('deve desvincular membros e excluir o cargo com sucesso', async () => {
      jest.spyOn(prisma.membroCasa, 'updateMany').mockResolvedValue({ count: 1 } as any);
      jest.spyOn(prisma.cargoCasa, 'delete').mockResolvedValue({ id: 'c1' } as any);

      const result = await service.excluirCargo('t1', 'c1');
      expect(prisma.membroCasa.updateMany).toHaveBeenCalledWith({
        where: { tenantId: 't1', cargoId: 'c1' },
        data: { cargoId: null },
      });
      expect(prisma.cargoCasa.delete).toHaveBeenCalledWith({
        where: { id_tenantId: { id: 'c1', tenantId: 't1' } },
      });
      expect(result).toEqual({ success: true });
    });
  });
});
