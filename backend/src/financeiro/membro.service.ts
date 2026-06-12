import { Injectable, BadRequestException, NotFoundException, ForbiddenException, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { FinanceiroGateway } from './financeiro.gateway';
import { AuditLogService } from './audit-log.service';
import { serializeBigInt } from '../shared/utils/serialization';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import { MembroDto } from './dto/membro.dto';
import { ProductValidationService } from './product-validation.service';
import { ValidationEventType } from '@prisma/client';

@Injectable()
export class MembroService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    private gateway: FinanceiroGateway,
    private auditLogService: AuditLogService,
    private productValidationService: ProductValidationService,
  ) {}

  async obterPreviewConvite(inviteCode: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
      include: {
        membros: {
          where: { userId: null },
          select: { id: true, nome: true, avatar: true }
        }
      }
    });

    if (!tenant) {
      throw new NotFoundException('Casa não encontrada.');
    }

    return serializeBigInt({
      id: tenant.id,
      name: tenant.name,
      membrosDisponiveis: tenant.membros
    });
  }

  async criarTenant(name: string, userId: string) {
    const inviteCode = `CASA-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const tenant = await this.prisma.$transaction(async (tx) => {
      const defaultPermissions = {
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
      };
      const createdTenant = await tx.tenant.create({
        data: {
          name,
          inviteCode,
          permissions: defaultPermissions,
        },
      });

      const user = await tx.usuario.findUnique({ where: { id: userId } });
      const nome = user?.nome || 'Membro Fundador';
      const avatar = (nome || 'MF').substring(0, 2).toUpperCase();

      await tx.membroCasa.create({
        data: {
          id: `membro-${randomUUID()}`,
          tenantId: createdTenant.id,
          nome,
          avatar,
          userId,
          role: Role.ADMIN,
        },
      });

      await this.productValidationService.registrarMarco(
        createdTenant.id,
        ValidationEventType.TENANT_CREATED,
        'first',
        {},
        tx,
      );

      return createdTenant;
    });

    return serializeBigInt(tenant);
  }

  async entrarTenantPorCodigo(inviteCode: string, userId: string) {
    const cleanedCode = inviteCode.trim().toUpperCase();
    const tenant = await this.prisma.tenant.findUnique({
      where: { inviteCode: cleanedCode },
    });

    if (!tenant) throw new NotFoundException('Código de convite inválido ou casa não encontrada.');

    const isMemberAlready = await this.prisma.membroCasa.findFirst({
      where: { tenantId: tenant.id, userId },
    });

    if (isMemberAlready) {
      await this.productValidationService.registrarSegundoUsuarioSeAplicavel(tenant.id);
      return serializeBigInt(tenant);
    }

    await this.vincularOuCriarMembroAoSistema(tenant.id, userId);
    await this.productValidationService.registrarSegundoUsuarioSeAplicavel(tenant.id);

    this.gateway.notificarAlteracao(tenant.id, 'membros_alterados');
    return serializeBigInt(tenant);
  }

  async listarMembros(tenantId: string) {
    const membros = await this.prisma.membroCasa.findMany({
      where: { tenantId },
    });
    return serializeBigInt(membros);
  }

  async salvarMembro(tenantId: string, membroData: MembroDto, executorUserId?: string) {
    const { id, nome, email, password, ativo, role, rendaCentavos } = membroData;
    let { userId } = membroData;

    const finalEmail = email || (membroData as any).username;
    const isActive = ativo !== undefined ? ativo : true;
    const memberRole = role || Role.MORADOR;

    const membroAtual = await this.prisma.membroCasa.findUnique({
      where: { id_tenantId: { id, tenantId } },
    });

    if (executorUserId) {
      const executorMembro = await this.prisma.membroCasa.findFirst({
        where: { tenantId, userId: executorUserId }
      });

      if (executorMembro && executorMembro.role !== Role.ADMIN) {
        if (id !== executorMembro.id) {
          throw new ForbiddenException('Você só pode editar os seus próprios dados.');
        }
        if (membroAtual) {
          if (role && role !== membroAtual.role) {
            throw new BadRequestException('Você não pode alterar o seu próprio papel.');
          }
          if (ativo !== undefined && ativo !== membroAtual.ativo) {
            throw new BadRequestException('Você não pode alterar o seu próprio status de atividade.');
          }

          // Validar alteração de nome/renda contra as feature flags da role do executor
          const permissions = await this.obterTenantPermissions(tenantId);
          const rolePermissions = permissions[executorMembro.role] || {};

          if (nome !== undefined && nome !== membroAtual.nome) {
            const allowed = rolePermissions.ALLOW_ALTERAR_NOME !== false;
            if (!allowed) {
              throw new ForbiddenException('O administrador da moradia desativou a permissão de alterar o nome para o seu papel.');
            }
          }

          const rendaAtual = membroAtual.rendaCentavos !== null ? Number(membroAtual.rendaCentavos) : null;
          const rendaNova = (rendaCentavos !== undefined && rendaCentavos !== null) ? Number(rendaCentavos) : null;
          if (rendaNova !== rendaAtual) {
            const allowed = rolePermissions.ALLOW_ALTERAR_RENDA !== false;
            if (!allowed) {
              throw new ForbiddenException('O administrador da moradia desativou a permissão de alterar a renda para o seu papel.');
            }
          }
        }
      }
    }

    await this.validarRegrasSalvarMembro(tenantId, id, finalEmail, password, memberRole, isActive);

    if (!userId && finalEmail && password) {
      const newUser = await this.authService.register(finalEmail, nome, password);
      userId = newUser.userId;
    }

    const upserted = await this.persistirMembro(tenantId, {
      ...membroData,
      ativo: isActive,
      role: memberRole,
      userId,
    });

    if (upserted.ativo && upserted.userId) {
      await this.productValidationService.registrarSegundoUsuarioSeAplicavel(tenantId);
    }

    if (membroAtual) {
      const rendaAtual = membroAtual.rendaCentavos !== null ? Number(membroAtual.rendaCentavos) : null;
      const rendaNova = (rendaCentavos !== undefined && rendaCentavos !== null) ? Number(rendaCentavos) : null;
      if (rendaAtual !== rendaNova) {
        let executorMembroId = id; // fallback
        if (executorUserId) {
          const executor = await this.prisma.membroCasa.findFirst({
            where: { tenantId, userId: executorUserId }
          });
          if (executor) executorMembroId = executor.id;
        }

        const valorAntigoStr = rendaAtual !== null ? `R$ ${(rendaAtual / 100).toFixed(2)}` : 'não informada';
        const valorNovoStr = rendaNova !== null ? `R$ ${(rendaNova / 100).toFixed(2)}` : 'não informada';
        await this.auditLogService.registrar(
          tenantId,
          executorMembroId,
          'ALTERAR_RENDA',
          `Renda de ${membroAtual.nome} alterada de ${valorAntigoStr} para ${valorNovoStr}.`
        );
      }
    }

    this.gateway.notificarAlteracao(tenantId, 'membros_alterados');
    return serializeBigInt(upserted);
  }

  private async persistirMembro(tenantId: string, data: MembroDto) {
    const { id, nome, avatar, ativo, role, userId, rendaCentavos } = data;
    const defaultAvatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nome)}`;
    const rendaBigInt = (rendaCentavos !== undefined && rendaCentavos !== null) ? BigInt(rendaCentavos) : null;

    return this.prisma.membroCasa.upsert({
      where: { id_tenantId: { id, tenantId } },
      create: {
        id, tenantId, nome, avatar: defaultAvatar,
        ativo: ativo!, role: role!, userId,
        rendaCentavos: rendaBigInt,
      },
      update: {
        nome, avatar: defaultAvatar,
        ativo: ativo!, role: role!, userId,
        rendaCentavos: rendaBigInt,
      },
    });
  }

  private async validarRegrasSalvarMembro(
    tenantId: string, id: string, emailOrUsername?: string, password?: string,
    newRole?: Role, isActive?: boolean
  ) {
    const membroAtual = await this.prisma.membroCasa.findUnique({
      where: { id_tenantId: { id, tenantId } },
    });

    if (!membroAtual) {
      if (!emailOrUsername?.trim() || !password?.trim()) {
        throw new BadRequestException('Usuário e senha são obrigatórios para a criação de um novo morador.');
      }
      return;
    }

    // Impede desativação se houver saldo contábil pendente
    if (membroAtual.ativo && isActive === false) {
      const totalPago = await this.prisma.gasto.aggregate({
        where: { tenantId, compradorId: id },
        _sum: { valorTotalCentavos: true }
      });
      const totalDevido = await this.prisma.divisaoGasto.aggregate({
        where: { tenantId, membroId: id },
        _sum: { valorCentavos: true }
      });

      const pago = Number(totalPago._sum.valorTotalCentavos || 0n);
      const devido = Number(totalDevido._sum.valorCentavos || 0n);
      const saldoCentavos = pago - devido;

      if (saldoCentavos !== 0) {
        throw new BadRequestException('Não é possível desativar um morador com saldo pendente na moradia (Saldo atual: R$ ' + (saldoCentavos / 100).toFixed(2).replace('.', ',') + ').');
      }
    }

    const isAdminAtivo = membroAtual.role === Role.ADMIN && membroAtual.ativo;
    const isLosingAdmin = !isActive || newRole !== Role.ADMIN;

    if (isAdminAtivo && isLosingAdmin) {
      const adminsAtivos = await this.prisma.membroCasa.count({
        where: { tenantId, role: Role.ADMIN, ativo: true },
      });
      if (adminsAtivos <= 1) {
        throw new BadRequestException('A moradia precisa ter pelo menos um administrador ativo.');
      }
    }
  }

  async vincularOuCriarMembroAoSistema(tenantId: string, userId: string) {
    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    const nome = user ? user.nome : 'Convidado';

    const perfilExistente = await this.prisma.membroCasa.findFirst({
      where: {
        tenantId,
        nome: { equals: nome, mode: 'insensitive' },
        userId: null,
      },
    });

    if (perfilExistente) {
      await this.prisma.membroCasa.update({
        where: { id_tenantId: { id: perfilExistente.id, tenantId } },
        data: { userId },
      });
      return;
    }

    await this.prisma.membroCasa.create({
      data: {
        id: `membro-${randomUUID()}`,
        tenantId,
        nome: nome,
        avatar: nome.substring(0, 2).toUpperCase(),
        userId,
      },
    });
  }

  async obterMembroPorUsuario(tenantId: string, userId: string) {
    const membro = await this.prisma.membroCasa.findFirst({
      where: { tenantId, userId },
    });
    return serializeBigInt(membro);
  }

  async obterTenantPermissions(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { permissions: true }
    });

    const defaultPermissions = {
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
    };

    if (!tenant || !tenant.permissions) {
      return defaultPermissions;
    }

    const currentPermissions = (tenant.permissions as Record<string, any>) || {};
    const merged: Record<string, any> = {};

    // Mapear todas as roles persistidas no banco
    for (const role of Object.keys(currentPermissions)) {
      merged[role] = {
        ALLOW_LANCAR_GASTO: currentPermissions[role]?.ALLOW_LANCAR_GASTO !== false,
        ALLOW_GERENCIAR_CARTOES: currentPermissions[role]?.ALLOW_GERENCIAR_CARTOES !== false,
        ALLOW_GERENCIAR_CONTAS_FIXAS: currentPermissions[role]?.ALLOW_GERENCIAR_CONTAS_FIXAS !== false,
        ALLOW_REGISTRAR_NETTING: currentPermissions[role]?.ALLOW_REGISTRAR_NETTING !== false,
        ALLOW_VER_AUDIT_LOGS: currentPermissions[role]?.ALLOW_VER_AUDIT_LOGS !== false,
        ALLOW_ALTERAR_RENDA: currentPermissions[role]?.ALLOW_ALTERAR_RENDA !== false,
        ALLOW_ALTERAR_NOME: currentPermissions[role]?.ALLOW_ALTERAR_NOME !== false,
        ALLOW_FECHAR_PERIODO: currentPermissions[role]?.ALLOW_FECHAR_PERIODO !== false,
      };
    }

    // Tratamento de retrocompatibilidade de dados de migration anterior (caso chaves estejam na raiz)
    if (currentPermissions.ALLOW_MORADOR_LANCAR_GASTO !== undefined && !merged.MORADOR) {
      merged.MORADOR = {
        ALLOW_LANCAR_GASTO: currentPermissions.ALLOW_MORADOR_LANCAR_GASTO !== false,
        ALLOW_GERENCIAR_CARTOES: currentPermissions.ALLOW_MORADOR_GERENCIAR_CARTOES !== false,
        ALLOW_GERENCIAR_CONTAS_FIXAS: currentPermissions.ALLOW_MORADOR_GERENCIAR_CONTAS_FIXAS !== false,
        ALLOW_REGISTRAR_NETTING: currentPermissions.ALLOW_MORADOR_REGISTRAR_NETTING !== false,
        ALLOW_VER_AUDIT_LOGS: currentPermissions.ALLOW_MORADOR_VER_AUDIT_LOGS !== false,
      };
    }

    // Garantir que as roles padrão estejam presentes
    if (!merged.MORADOR) {
      merged.MORADOR = defaultPermissions.MORADOR;
    }
    if (!merged.VISUALIZADOR) {
      merged.VISUALIZADOR = defaultPermissions.VISUALIZADOR;
    }

    return merged;
  }

  async atualizarTenantPermissions(tenantId: string, roleName: string, permissionsData: any, executorUserId: string) {
    const executor = await this.prisma.membroCasa.findFirst({
      where: { tenantId, userId: executorUserId }
    });

    if (!executor || executor.role !== Role.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem atualizar as permissões da moradia.');
    }

    const currentPermissions = await this.obterTenantPermissions(tenantId);
    const currentRolePermissions = currentPermissions[roleName] || {
      ALLOW_LANCAR_GASTO: true,
      ALLOW_GERENCIAR_CARTOES: true,
      ALLOW_GERENCIAR_CONTAS_FIXAS: true,
      ALLOW_REGISTRAR_NETTING: true,
      ALLOW_VER_AUDIT_LOGS: true,
    };

    const updatedRolePermissions = {
      ALLOW_LANCAR_GASTO: permissionsData.ALLOW_LANCAR_GASTO !== undefined ? !!permissionsData.ALLOW_LANCAR_GASTO : currentRolePermissions.ALLOW_LANCAR_GASTO,
      ALLOW_GERENCIAR_CARTOES: permissionsData.ALLOW_GERENCIAR_CARTOES !== undefined ? !!permissionsData.ALLOW_GERENCIAR_CARTOES : currentRolePermissions.ALLOW_GERENCIAR_CARTOES,
      ALLOW_GERENCIAR_CONTAS_FIXAS: permissionsData.ALLOW_GERENCIAR_CONTAS_FIXAS !== undefined ? !!permissionsData.ALLOW_GERENCIAR_CONTAS_FIXAS : currentRolePermissions.ALLOW_GERENCIAR_CONTAS_FIXAS,
      ALLOW_REGISTRAR_NETTING: permissionsData.ALLOW_REGISTRAR_NETTING !== undefined ? !!permissionsData.ALLOW_REGISTRAR_NETTING : currentRolePermissions.ALLOW_REGISTRAR_NETTING,
      ALLOW_VER_AUDIT_LOGS: permissionsData.ALLOW_VER_AUDIT_LOGS !== undefined ? !!permissionsData.ALLOW_VER_AUDIT_LOGS : currentRolePermissions.ALLOW_VER_AUDIT_LOGS,
      ALLOW_ALTERAR_RENDA: permissionsData.ALLOW_ALTERAR_RENDA !== undefined ? !!permissionsData.ALLOW_ALTERAR_RENDA : currentRolePermissions.ALLOW_ALTERAR_RENDA,
      ALLOW_ALTERAR_NOME: permissionsData.ALLOW_ALTERAR_NOME !== undefined ? !!permissionsData.ALLOW_ALTERAR_NOME : currentRolePermissions.ALLOW_ALTERAR_NOME,
      ALLOW_FECHAR_PERIODO: permissionsData.ALLOW_FECHAR_PERIODO !== undefined ? !!permissionsData.ALLOW_FECHAR_PERIODO : currentRolePermissions.ALLOW_FECHAR_PERIODO,
    };

    const newPermissions = {
      ...currentPermissions,
      [roleName]: updatedRolePermissions
    };

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { permissions: newPermissions }
    });

    await this.auditLogService.registrar(
      tenantId,
      executor.id,
      'ALTERAR_RENDA',
      `Permissões do papel ${roleName} da moradia foram atualizadas pelo administrador.`
    );

    this.gateway.notificarAlteracao(tenantId, 'permissoes_alteradas');
    return newPermissions;
  }
}
