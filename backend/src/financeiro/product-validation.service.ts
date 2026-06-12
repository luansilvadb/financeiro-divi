import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, ValidationEventType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ValidationStatusDto } from './dto/validation-status.dto';

export interface ValidationMetadata {
  splitMode?: string;
  paymentMethod?: string;
  participantCount?: number;
  installmentCount?: number;
  isRecurringBill?: boolean;
}

interface RegistrarMarcoOptions {
  periodKey?: string;
  metadata?: ValidationMetadata;
}

const METADATA_KEYS = new Set<keyof ValidationMetadata>([
  'splitMode',
  'paymentMethod',
  'participantCount',
  'installmentCount',
  'isRecurringBill',
]);

@Injectable()
export class ProductValidationService {
  private readonly logger = new Logger(ProductValidationService.name);

  constructor(private prisma: PrismaService) {}

  async registrarMarco(
    tenantId: string,
    type: ValidationEventType,
    dedupeKey: string,
    options: RegistrarMarcoOptions = {},
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const db = tx || this.prisma;
    const metadata = this.sanitizarMetadata(options.metadata);

    await db.productValidationEvent.upsert({
      where: {
        tenantId_type_dedupeKey: { tenantId, type, dedupeKey },
      },
      create: {
        tenantId,
        type,
        dedupeKey,
        periodKey: options.periodKey,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
      update: {},
    });
  }

  async registrarSegundoUsuarioSeAplicavel(
    tenantId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const db = tx || this.prisma;
    const linkedMembers = await db.membroCasa.count({
      where: {
        tenantId,
        ativo: true,
        userId: { not: null },
      },
    });

    if (linkedMembers >= 2) {
      await this.registrarMarco(
        tenantId,
        ValidationEventType.SECOND_LINKED_MEMBER_JOINED,
        'first',
        {},
        tx,
      );
    }
  }

  async registrarPeriodoFechadoSeConsolidado(
    tenantId: string,
    mes: number,
    ano: number,
  ): Promise<void> {
    const faturas = await this.prisma.fatura.findMany({
      where: { tenantId, mes, ano },
      select: { status: true },
    });

    if (faturas.length === 0 || faturas.some((fatura) => fatura.status === 'ABERTA')) {
      return;
    }

    const periodKey = this.formatarPeriodo(mes, ano);
    await this.registrarMarco(
      tenantId,
      ValidationEventType.PERIOD_CLOSED,
      periodKey,
      { periodKey },
    );
  }

  async obterStatus(tenantId: string): Promise<ValidationStatusDto> {
    const [tenant, events] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { createdAt: true },
      }),
      this.prisma.productValidationEvent.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    if (!tenant) {
      throw new NotFoundException('Casa não encontrada.');
    }

    const firstByType = (type: ValidationEventType) =>
      events.find((event) => event.type === type)?.createdAt || null;

    const closedPeriods = Array.from(new Set(
      events
        .filter((event) => event.type === ValidationEventType.PERIOD_CLOSED)
        .map((event) => event.periodKey)
        .filter((periodKey): periodKey is string => this.periodoValido(periodKey)),
    )).sort();

    const secondLinkedMemberAt = firstByType(ValidationEventType.SECOND_LINKED_MEMBER_JOINED);
    const firstExpenseAt = firstByType(ValidationEventType.FIRST_EXPENSE_CREATED);
    const firstSettlementAt = firstByType(ValidationEventType.FIRST_SETTLEMENT_RECORDED);

    return {
      tenantCreatedAt: tenant.createdAt,
      secondLinkedMemberAt,
      firstExpenseAt,
      closedPeriods,
      firstSettlementAt,
      activationComplete: Boolean(secondLinkedMemberAt && firstExpenseAt && closedPeriods.length > 0),
      repeatedValue: closedPeriods.length >= 2,
    };
  }

  private sanitizarMetadata(metadata?: ValidationMetadata): ValidationMetadata | undefined {
    if (!metadata) return undefined;

    const sanitized: ValidationMetadata = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (!METADATA_KEYS.has(key as keyof ValidationMetadata)) {
        if (process.env.NODE_ENV !== 'production') {
          throw new Error(`Metadata de validação não permitida: ${key}`);
        }
        this.logger.warn(`Metadata de validação ignorada: ${key}`);
        continue;
      }
      if (value !== undefined) {
        (sanitized as Record<string, unknown>)[key] = value;
      }
    }
    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }

  private formatarPeriodo(mes: number, ano: number): string {
    return `${ano}-${String(mes).padStart(2, '0')}`;
  }

  private periodoValido(periodKey: string | null): periodKey is string {
    return Boolean(periodKey && /^\d{4}-(0[1-9]|1[0-2])$/.test(periodKey));
  }
}
