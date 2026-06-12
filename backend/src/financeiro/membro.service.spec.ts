import { Test, TestingModule } from '@nestjs/testing';
import { MembroService } from './membro.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { FinanceiroGateway } from './financeiro.gateway';
import { AuditLogService } from './audit-log.service';
import { Role } from '@prisma/client';
import { ProductValidationService } from './product-validation.service';

describe('MembroService', () => {
  let service: MembroService;
  let prisma: PrismaService;

  const mockPrisma = {
    $transaction: jest.fn((fn) => fn(mockPrisma)),
    membroCasa: {
      findUnique: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn().mockResolvedValue({ id: 'm1', role: 'ADMIN', ativo: true }),
      create: jest.fn().mockResolvedValue({ id: 'm1', role: 'ADMIN', ativo: true }),
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    },
    tenant: {
      create: jest.fn().mockResolvedValue({ id: 't1', name: 'Casa Teste', inviteCode: 'CASA-TESTE' }),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    usuario: {
      findUnique: jest.fn().mockResolvedValue({ id: 'u1', nome: 'Luan' }),
    },
  };

  const mockAuth = {
    register: jest.fn().mockResolvedValue({ userId: 'user-new' }),
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
    registrarSegundoUsuarioSeAplicavel: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembroService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuthService, useValue: mockAuth },
        { provide: FinanceiroGateway, useValue: mockGateway },
        { provide: AuditLogService, useValue: mockAuditLog },
        { provide: ProductValidationService, useValue: mockProductValidation },
      ],
    }).compile();

    service = module.get<MembroService>(MembroService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
      expect(mockProductValidation.registrarMarco).toHaveBeenCalledWith(
        't1',
        'TENANT_CREATED',
        'first',
        {},
        mockPrisma,
      );
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
        email: 'luan.novo@example.com',
        password: 'senha_secreta'
      };
      const result = await service.salvarMembro('t1', data);
      expect(prisma.membroCasa.upsert).toHaveBeenCalled();
      expect(mockAuth.register).toHaveBeenCalledWith('luan.novo@example.com', 'Luan', 'senha_secreta');
      expect(result).toBeDefined();
    });

    it('deve rejeitar a criação de membro se não fornecer usuário e senha', async () => {
      jest.spyOn(prisma.membroCasa, 'findUnique').mockResolvedValue(null);
      const data = { id: 'm1', nome: 'Luan', ativo: true, role: Role.MORADOR };
      await expect(service.salvarMembro('t1', (data as any))).rejects.toThrow(
        'Usuário e senha são obrigatórios para a criação de um novo morador.'
      );
    });
  });
});
