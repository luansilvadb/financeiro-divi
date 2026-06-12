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
      update: jest.fn(),
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
        data: { 
          name: 'Minha Casa', 
          inviteCode: expect.any(String),
          permissions: {
            MORADOR: {
              ALLOW_LANCAR_GASTO: true,
              ALLOW_GERENCIAR_CARTOES: true,
              ALLOW_GERENCIAR_CONTAS_FIXAS: true,
              ALLOW_REGISTRAR_NETTING: true,
              ALLOW_VER_AUDIT_LOGS: true,
              ALLOW_ALTERAR_RENDA: true,
              ALLOW_ALTERAR_NOME: true,
              ALLOW_FECHAR_PERIODO: true,
            },
            VISUALIZADOR: {
              ALLOW_LANCAR_GASTO: false,
              ALLOW_GERENCIAR_CARTOES: false,
              ALLOW_GERENCIAR_CONTAS_FIXAS: false,
              ALLOW_REGISTRAR_NETTING: false,
              ALLOW_VER_AUDIT_LOGS: false,
              ALLOW_ALTERAR_RENDA: false,
              ALLOW_ALTERAR_NOME: false,
              ALLOW_FECHAR_PERIODO: false,
            }
          }
        }
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

    it('deve rejeitar alteração de nome se flag ALLOW_ALTERAR_NOME for false para morador', async () => {
      jest.spyOn(prisma.membroCasa, 'findFirst').mockResolvedValue({ id: 'm1', role: Role.MORADOR } as any);
      jest.spyOn(prisma.membroCasa, 'findUnique').mockResolvedValue({ id: 'm1', nome: 'Luan Antigo', role: Role.MORADOR } as any);
      jest.spyOn(prisma.tenant, 'findUnique').mockResolvedValue({
        id: 't1',
        permissions: {
          MORADOR: {
            ALLOW_ALTERAR_NOME: false
          }
        }
      } as any);

      const data = { id: 'm1', nome: 'Luan Novo', role: Role.MORADOR };
      await expect(service.salvarMembro('t1', data, 'u1')).rejects.toThrow(
        'O administrador da moradia desativou a permissão de alterar o nome para o seu papel.'
      );
    });

    it('deve rejeitar alteração de renda se flag ALLOW_ALTERAR_RENDA for false para morador', async () => {
      jest.spyOn(prisma.membroCasa, 'findFirst').mockResolvedValue({ id: 'm1', role: Role.MORADOR } as any);
      jest.spyOn(prisma.membroCasa, 'findUnique').mockResolvedValue({ id: 'm1', nome: 'Luan', role: Role.MORADOR, rendaCentavos: 1000n } as any);
      jest.spyOn(prisma.tenant, 'findUnique').mockResolvedValue({
        id: 't1',
        permissions: {
          MORADOR: {
            ALLOW_ALTERAR_RENDA: false
          }
        }
      } as any);

      const data = { id: 'm1', nome: 'Luan', role: Role.MORADOR, rendaCentavos: 5000 };
      await expect(service.salvarMembro('t1', data, 'u1')).rejects.toThrow(
        'O administrador da moradia desativou a permissão de alterar a renda para o seu papel.'
      );
    });
  });

  describe('permissoesTenant', () => {
    it('deve obter permissões com default se vazio', async () => {
      jest.spyOn(prisma.tenant, 'findUnique').mockResolvedValue({ id: 't1', name: 'Casa', inviteCode: 'C1', permissions: null } as any);
      const perms = await service.obterTenantPermissions('t1');
      expect(perms.MORADOR.ALLOW_LANCAR_GASTO).toBe(true);
      expect(perms.VISUALIZADOR.ALLOW_LANCAR_GASTO).toBe(false);
    });

    it('deve obter permissões com retrocompatibilidade se possuir flags legadas', async () => {
      jest.spyOn(prisma.tenant, 'findUnique').mockResolvedValue({
        id: 't1',
        name: 'Casa',
        inviteCode: 'C1',
        permissions: {
          ALLOW_MORADOR_LANCAR_GASTO: false,
          ALLOW_MORADOR_GERENCIAR_CARTOES: true,
        }
      } as any);
      const perms = await service.obterTenantPermissions('t1');
      expect(perms.MORADOR.ALLOW_LANCAR_GASTO).toBe(false);
      expect(perms.MORADOR.ALLOW_GERENCIAR_CARTOES).toBe(true);
    });

    it('deve atualizar permissões do tenant por role se executor for ADMIN', async () => {
      jest.spyOn(prisma.membroCasa, 'findFirst').mockResolvedValue({ id: 'm-admin', role: Role.ADMIN } as any);
      jest.spyOn(prisma.tenant, 'findUnique').mockResolvedValue({ id: 't1', permissions: {} } as any);
      const updateMock = jest.spyOn(prisma.tenant, 'update').mockResolvedValue({ id: 't1' } as any);

      const dataDto = { ALLOW_LANCAR_GASTO: false };
      const res = await service.atualizarTenantPermissions('t1', 'MORADOR', dataDto, 'u-admin');

      expect(updateMock).toHaveBeenCalled();
      expect(res.MORADOR.ALLOW_LANCAR_GASTO).toBe(false);
      expect(mockGateway.notificarAlteracao).toHaveBeenCalledWith('t1', 'permissoes_alteradas');
    });

    it('deve rejeitar atualização se executor não for ADMIN', async () => {
      jest.spyOn(prisma.membroCasa, 'findFirst').mockResolvedValue({ id: 'm-morador', role: Role.MORADOR } as any);
      await expect(service.atualizarTenantPermissions('t1', 'MORADOR', {}, 'u-morador')).rejects.toThrow(
        'Apenas administradores podem atualizar as permissões da moradia.'
      );
    });
  });
});
