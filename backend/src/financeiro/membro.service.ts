import { Injectable, BadRequestException, NotFoundException, forwardRef, Inject } from '@nestjs/common';
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
      const createdTenant = await tx.tenant.create({
        data: {
          name,
          inviteCode,
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
}
