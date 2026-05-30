# Fluxo Fatura Periodo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make DIVI match the real household flow: open card invoices are forecasts, closing an invoice creates real member settlements, and closing a month only archives/carries pending balances.

**Architecture:** Keep the existing Vue/TypeScript domain-service pattern. Add a small anticipation model, fix `AcertoMembro` directionality, split dashboard balances into real payable balance and open-card forecast, and stop month rollover from automatically closing card invoices.

**Tech Stack:** Vue 3, TypeScript, Vitest, NestJS, Prisma/Postgres, HTTP repositories.

---

## File Structure

- `src/models/entities/AcertoMembro.ts`: extend settlement direction and store anticipation snapshot.
- `src/models/entities/AntecipacaoFatura.ts`: new domain entity for pre-closing card payments.
- `src/models/repositories/IAntecipacaoFaturaRepository.ts`: new repository contract.
- `src/models/repositories/http/HttpAntecipacaoFaturaRepository.ts`: HTTP repository for anticipations.
- `src/models/services/FaturaService.ts`: generate final settlements from closed invoices using consumption minus anticipations.
- `src/models/services/DashboardSaldoService.ts`: new pure helpers to split real payable balance from open-card forecast.
- `src/models/services/FaturaRolloverService.ts`: change month rollover so it does not close invoices automatically.
- `src/viewmodels/useDashboardNetting.ts`: consume the new dashboard balance helpers.
- `src/viewmodels/useDashboardViewModel.ts`: expose real balance, open-card forecast, and month-closing review data.
- `src/views/screens/DashboardSaldos.vue`: render separate blocks for real balance, open-card forecast, and pending settlements.
- `backend/prisma/schema.prisma`: persist anticipations and extra settlement fields.
- `backend/src/financeiro/dto/antecipacao-fatura.dto.ts`: DTO for anticipation API.
- `backend/src/financeiro/financeiro.service.ts`: list/save anticipations and persist extra settlement fields.
- `backend/src/financeiro/financeiro.controller.ts`: expose anticipation endpoints.

---

### Task 1: AcertoMembro Supports Settlement Direction

**Files:**
- Modify: `src/models/entities/AcertoMembro.ts`
- Test: `src/models/entities/AcertoMembro.test.ts`
- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/src/financeiro/dto/acerto.dto.ts`
- Modify: `backend/src/financeiro/financeiro.service.ts`
- Modify: `src/models/repositories/http/HttpAcertoMembroRepository.ts`

- [ ] **Step 1: Write failing entity tests**

Append these tests to `src/models/entities/AcertoMembro.test.ts`:

```ts
it('deve representar acerto em que o membro paga o responsavel', () => {
  const acerto = new AcertoMembro({
    id: 'ac-membro-paga',
    faturaId: 'f1',
    membroId: 'm2',
    totalConsumido: Dinheiro.deCentavos(30000),
    totalAntecipado: Dinheiro.deCentavos(10000),
    tipo: 'MEMBRO_PAGA'
  })

  expect(acerto.tipo).toBe('MEMBRO_PAGA')
  expect(acerto.totalAntecipado.centavos).toBe(10000)
  expect(acerto.valorAcerto.centavos).toBe(20000)
  expect(acerto.pago).toBe(false)
})

it('deve representar acerto em que o responsavel devolve ao membro', () => {
  const acerto = new AcertoMembro({
    id: 'ac-responsavel-paga',
    faturaId: 'f1',
    membroId: 'm2',
    totalConsumido: Dinheiro.deCentavos(10000),
    totalAntecipado: Dinheiro.deCentavos(15000),
    tipo: 'RESPONSAVEL_PAGA'
  })

  expect(acerto.tipo).toBe('RESPONSAVEL_PAGA')
  expect(acerto.valorAcerto.centavos).toBe(5000)
})
```

- [ ] **Step 2: Run the tests and confirm failure**

Run: `npx vitest run src/models/entities/AcertoMembro.test.ts`

Expected: FAIL because `totalAntecipado` and `RESPONSAVEL_PAGA` do not exist yet.

- [ ] **Step 3: Extend the entity**

Update `src/models/entities/AcertoMembro.ts` to this shape:

```ts
import { Dinheiro } from './Dinheiro'

export type TipoAcerto = 'MEMBRO_PAGA' | 'RESPONSAVEL_PAGA'

export interface AcertoMembroProps {
  id: string
  faturaId: string
  membroId: string
  totalConsumido: Dinheiro
  totalAntecipado?: Dinheiro
  valorPago?: Dinheiro
  tipo?: TipoAcerto
  pago?: boolean
  dataPagamento?: Date
}

export class AcertoMembro {
  public readonly id: string
  public readonly faturaId: string
  public readonly membroId: string
  public readonly totalConsumido: Dinheiro
  public readonly totalAntecipado: Dinheiro
  public readonly valorAcerto: Dinheiro
  public readonly tipo: TipoAcerto
  public valorPago: Dinheiro
  public pago: boolean
  public dataPagamento?: Date

  constructor(props: AcertoMembroProps) {
    this.id = props.id
    this.faturaId = props.faturaId
    this.membroId = props.membroId
    this.totalConsumido = props.totalConsumido
    this.totalAntecipado = props.totalAntecipado ?? Dinheiro.deCentavos(0)
    this.valorPago = props.valorPago ?? Dinheiro.deCentavos(0)
    this.dataPagamento = props.dataPagamento

    const liquido = props.totalConsumido.centavos - this.totalAntecipado.centavos
    this.tipo = props.tipo ?? (liquido >= 0 ? 'MEMBRO_PAGA' : 'RESPONSAVEL_PAGA')
    this.valorAcerto = Dinheiro.deCentavos(Math.abs(liquido))
    this.pago = props.pago ?? (this.valorPago.centavos >= this.valorAcerto.centavos)
  }

  public registrarReembolso(valor: Dinheiro, data: Date = new Date()): void {
    if (valor.centavos <= 0) {
      throw new Error('Valor do reembolso deve ser maior que zero')
    }
    const novoTotalPago = this.valorPago.somar(valor)
    if (novoTotalPago.centavos > this.valorAcerto.centavos) {
      throw new Error('Valor do reembolso excede a divida total do acerto')
    }
    this.valorPago = novoTotalPago
    if (this.valorPago.centavos >= this.valorAcerto.centavos) {
      this.pago = true
      this.dataPagamento = data
    }
  }
}
```

- [ ] **Step 4: Add persistence fields**

In `backend/prisma/schema.prisma`, add these fields to `model AcertoMembro`:

```prisma
  totalAntecipadoCentavos BigInt  @default(0) @map("total_antecipado_centavos")
  tipo                    String  @default("MEMBRO_PAGA")
```

Run: `cd backend; npx prisma generate`

Expected: Prisma client regenerates successfully.

- [ ] **Step 5: Update DTO and HTTP mapping**

In `backend/src/financeiro/dto/acerto.dto.ts`, add:

```ts
@ApiPropertyOptional({
  description: 'Total antecipado pelo membro antes do fechamento da fatura, em centavos',
  example: 10000,
})
@IsOptional()
@IsNumber()
totalAntecipadoCentavos?: number;

@ApiPropertyOptional({
  description: 'Direcao do acerto financeiro',
  example: 'MEMBRO_PAGA',
})
@IsOptional()
@IsString()
tipo?: 'MEMBRO_PAGA' | 'RESPONSAVEL_PAGA';
```

In `backend/src/financeiro/financeiro.service.ts`, update `salvarAcerto` destructuring and create/update data:

```ts
const {
  id,
  faturaId,
  membroId,
  totalConsumidoCentavos,
  totalAntecipadoCentavos,
  valorPagoCentavos,
  tipo,
  pago,
  dataPagamento,
} = acertoData;
```

Add to both `create` and `update`:

```ts
totalAntecipadoCentavos: BigInt(totalAntecipadoCentavos || 0),
tipo: tipo || 'MEMBRO_PAGA',
```

In `src/models/repositories/http/HttpAcertoMembroRepository.ts`, map both fields:

```ts
totalAntecipado: Dinheiro.deCentavos(item.totalAntecipadoCentavos || 0),
tipo: item.tipo || 'MEMBRO_PAGA',
```

And include them in `salvar` body:

```ts
totalAntecipadoCentavos: acerto.totalAntecipado.centavos,
tipo: acerto.tipo,
```

- [ ] **Step 6: Run focused tests and build**

Run:

```powershell
npx vitest run src/models/entities/AcertoMembro.test.ts
npm run build
```

Expected: tests PASS and build PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/models/entities/AcertoMembro.ts src/models/entities/AcertoMembro.test.ts backend/prisma/schema.prisma backend/src/financeiro/dto/acerto.dto.ts backend/src/financeiro/financeiro.service.ts src/models/repositories/http/HttpAcertoMembroRepository.ts
git commit -m "feat: support bidirectional invoice settlements"
```

---

### Task 2: Add AntecipacaoFatura Model and Repository

**Files:**
- Create: `src/models/entities/AntecipacaoFatura.ts`
- Create: `src/models/entities/AntecipacaoFatura.test.ts`
- Create: `src/models/repositories/IAntecipacaoFaturaRepository.ts`
- Create: `src/models/repositories/http/HttpAntecipacaoFaturaRepository.ts`
- Modify: `src/shared/container.ts`
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/src/financeiro/dto/antecipacao-fatura.dto.ts`
- Modify: `backend/src/financeiro/financeiro.service.ts`
- Modify: `backend/src/financeiro/financeiro.controller.ts`

- [ ] **Step 1: Write entity tests**

Create `src/models/entities/AntecipacaoFatura.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { AntecipacaoFatura } from './AntecipacaoFatura'
import { Dinheiro } from './Dinheiro'

describe('AntecipacaoFatura', () => {
  it('deve exigir valor positivo', () => {
    expect(() => new AntecipacaoFatura({
      id: 'ant-1',
      faturaId: 'fat-1',
      membroId: 'm2',
      responsavelId: 'm1',
      valor: Dinheiro.deCentavos(0),
      data: new Date('2026-05-29T12:00:00Z')
    })).toThrow('Valor da antecipacao deve ser maior que zero')
  })

  it('deve guardar a antecipacao vinculada a fatura, membro e responsavel', () => {
    const ant = new AntecipacaoFatura({
      id: 'ant-1',
      faturaId: 'fat-1',
      membroId: 'm2',
      responsavelId: 'm1',
      valor: Dinheiro.deCentavos(10000),
      data: new Date('2026-05-29T12:00:00Z'),
      observacao: 'Liberar limite'
    })

    expect(ant.faturaId).toBe('fat-1')
    expect(ant.membroId).toBe('m2')
    expect(ant.responsavelId).toBe('m1')
    expect(ant.valor.centavos).toBe(10000)
    expect(ant.observacao).toBe('Liberar limite')
  })
})
```

- [ ] **Step 2: Run the tests and confirm failure**

Run: `npx vitest run src/models/entities/AntecipacaoFatura.test.ts`

Expected: FAIL because the entity file does not exist.

- [ ] **Step 3: Create the entity**

Create `src/models/entities/AntecipacaoFatura.ts`:

```ts
import { Dinheiro } from './Dinheiro'

export interface AntecipacaoFaturaProps {
  id: string
  faturaId: string
  membroId: string
  responsavelId: string
  valor: Dinheiro
  data: Date
  observacao?: string | null
}

export class AntecipacaoFatura {
  public readonly id: string
  public readonly faturaId: string
  public readonly membroId: string
  public readonly responsavelId: string
  public readonly valor: Dinheiro
  public readonly data: Date
  public readonly observacao: string | null

  constructor(props: AntecipacaoFaturaProps) {
    if (!props.valor.isPositivo()) {
      throw new Error('Valor da antecipacao deve ser maior que zero')
    }

    this.id = props.id
    this.faturaId = props.faturaId
    this.membroId = props.membroId
    this.responsavelId = props.responsavelId
    this.valor = props.valor
    this.data = props.data
    this.observacao = props.observacao ?? null
  }
}
```

- [ ] **Step 4: Add repository contract and HTTP implementation**

Create `src/models/repositories/IAntecipacaoFaturaRepository.ts`:

```ts
import type { AntecipacaoFatura } from '../entities/AntecipacaoFatura'

export interface IAntecipacaoFaturaRepository {
  listarTodos(): Promise<AntecipacaoFatura[]>
  buscarPorFatura(faturaId: string): Promise<AntecipacaoFatura[]>
  salvar(antecipacao: AntecipacaoFatura): Promise<void>
  excluir(id: string): Promise<void>
}
```

Create `src/models/repositories/http/HttpAntecipacaoFaturaRepository.ts`:

```ts
import { AntecipacaoFatura } from '../../entities/AntecipacaoFatura'
import { Dinheiro } from '../../entities/Dinheiro'
import type { IAntecipacaoFaturaRepository } from '../IAntecipacaoFaturaRepository'
import { HttpBaseRepository } from './HttpBaseRepository'

export class HttpAntecipacaoFaturaRepository extends HttpBaseRepository implements IAntecipacaoFaturaRepository {
  private mapToEntity(item: any): AntecipacaoFatura {
    return new AntecipacaoFatura({
      id: item.id,
      faturaId: item.faturaId,
      membroId: item.membroId,
      responsavelId: item.responsavelId,
      valor: Dinheiro.deCentavos(item.valorCentavos),
      data: new Date(item.data),
      observacao: item.observacao ?? null
    })
  }

  async listarTodos(): Promise<AntecipacaoFatura[]> {
    const list = await this.request<any[]>('/financeiro/antecipacoes-fatura')
    return list.map(item => this.mapToEntity(item))
  }

  async buscarPorFatura(faturaId: string): Promise<AntecipacaoFatura[]> {
    const list = await this.listarTodos()
    return list.filter(a => a.faturaId === faturaId)
  }

  async salvar(antecipacao: AntecipacaoFatura): Promise<void> {
    await this.request('/financeiro/antecipacoes-fatura', {
      method: 'POST',
      body: JSON.stringify({
        id: antecipacao.id,
        faturaId: antecipacao.faturaId,
        membroId: antecipacao.membroId,
        responsavelId: antecipacao.responsavelId,
        valorCentavos: antecipacao.valor.centavos,
        data: antecipacao.data,
        observacao: antecipacao.observacao
      })
    })
  }

  async excluir(id: string): Promise<void> {
    await this.request(`/financeiro/antecipacoes-fatura/${id}`, { method: 'DELETE' })
  }
}
```

- [ ] **Step 5: Add backend persistence and endpoints**

In `backend/prisma/schema.prisma`, add relation on `Tenant`:

```prisma
  antecipacoesFatura AntecipacaoFatura[]
```

Add model:

```prisma
model AntecipacaoFatura {
  id             String   @id
  tenantId       String   @map("tenant_id") @db.Uuid
  faturaId       String   @map("fatura_id")
  membroId       String   @map("membro_id")
  responsavelId  String   @map("responsavel_id")
  valorCentavos  BigInt   @map("valor_centavos")
  data           DateTime
  observacao     String?
  createdAt      DateTime @default(now()) @map("created_at")

  tenant         Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@map("antecipacoes_fatura")
}
```

Create `backend/src/financeiro/dto/antecipacao-fatura.dto.ts`:

```ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AntecipacaoFaturaDto {
  @ApiProperty({ example: 'ant-1' })
  @IsNotEmpty()
  @IsString()
  id!: string;

  @ApiProperty({ example: 'fat-1' })
  @IsNotEmpty()
  @IsString()
  faturaId!: string;

  @ApiProperty({ example: 'membro-joao' })
  @IsNotEmpty()
  @IsString()
  membroId!: string;

  @ApiProperty({ example: 'membro-luan' })
  @IsNotEmpty()
  @IsString()
  responsavelId!: string;

  @ApiProperty({ example: 10000 })
  @IsNotEmpty()
  @IsNumber()
  valorCentavos!: number;

  @ApiProperty({ example: '2026-05-29T12:00:00.000Z' })
  @IsNotEmpty()
  @IsDateString()
  data!: string;

  @ApiPropertyOptional({ example: 'Liberar limite do cartao' })
  @IsOptional()
  @IsString()
  observacao?: string | null;
}
```

In `backend/src/financeiro/financeiro.service.ts`, add:

```ts
async listarAntecipacoesFatura(tenantId: string) {
  const antecipacoes = await this.prisma.antecipacaoFatura.findMany({ where: { tenantId } });
  return serializeBigInt(antecipacoes);
}

async salvarAntecipacaoFatura(tenantId: string, data: any) {
  const { id, faturaId, membroId, responsavelId, valorCentavos, observacao } = data;
  const saved = await this.prisma.antecipacaoFatura.upsert({
    where: { id },
    create: {
      id,
      tenantId,
      faturaId,
      membroId,
      responsavelId,
      valorCentavos: BigInt(valorCentavos || 0),
      data: new Date(data.data),
      observacao: observacao || null,
    },
    update: {
      faturaId,
      membroId,
      responsavelId,
      valorCentavos: BigInt(valorCentavos || 0),
      data: new Date(data.data),
      observacao: observacao || null,
    },
  });
  return serializeBigInt(saved);
}

async excluirAntecipacaoFatura(tenantId: string, id: string) {
  await this.prisma.antecipacaoFatura.deleteMany({ where: { tenantId, id } });
  return { success: true };
}
```

In `backend/src/financeiro/financeiro.controller.ts`, import `AntecipacaoFaturaDto` and add endpoints:

```ts
@Get('antecipacoes-fatura')
async listarAntecipacoesFatura(@Headers('x-tenant-id') tenantId: string) {
  if (!tenantId) throw new BadRequestException('O cabecalho x-tenant-id e obrigatorio.');
  return this.financeiroService.listarAntecipacoesFatura(tenantId);
}

@Post('antecipacoes-fatura')
async salvarAntecipacaoFatura(@Headers('x-tenant-id') tenantId: string, @Body() dto: AntecipacaoFaturaDto) {
  if (!tenantId) throw new BadRequestException('O cabecalho x-tenant-id e obrigatorio.');
  return this.financeiroService.salvarAntecipacaoFatura(tenantId, dto);
}

@Delete('antecipacoes-fatura/:id')
async excluirAntecipacaoFatura(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
  if (!tenantId) throw new BadRequestException('O cabecalho x-tenant-id e obrigatorio.');
  return this.financeiroService.excluirAntecipacaoFatura(tenantId, id);
}
```

- [ ] **Step 6: Wire repository in container**

In `src/shared/container.ts`, import and export:

```ts
import { HttpAntecipacaoFaturaRepository } from '../models/repositories/http/HttpAntecipacaoFaturaRepository'

export const antecipacaoFaturaRepository = new HttpAntecipacaoFaturaRepository()
```

- [ ] **Step 7: Verify**

Run:

```powershell
npx vitest run src/models/entities/AntecipacaoFatura.test.ts
cd backend; npx prisma generate
cd ..; npm run build
```

Expected: tests PASS, Prisma generation PASS, build PASS.

- [ ] **Step 8: Commit**

```powershell
git add src/models/entities/AntecipacaoFatura.ts src/models/entities/AntecipacaoFatura.test.ts src/models/repositories/IAntecipacaoFaturaRepository.ts src/models/repositories/http/HttpAntecipacaoFaturaRepository.ts src/shared/container.ts backend/prisma/schema.prisma backend/src/financeiro/dto/antecipacao-fatura.dto.ts backend/src/financeiro/financeiro.service.ts backend/src/financeiro/financeiro.controller.ts
git commit -m "feat: add invoice anticipation model"
```

---

### Task 3: Close Invoice Using Net Consumption Minus Anticipations

**Files:**
- Modify: `src/models/services/FaturaService.ts`
- Test: `src/models/services/FaturaService.test.ts`
- Modify: `src/shared/container.ts`

- [ ] **Step 1: Add failing FaturaService tests**

Append to `src/models/services/FaturaService.test.ts`:

```ts
it('deve excluir o responsavel da fatura dos acertos contra si mesmo', async () => {
  const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
  const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
  const acertoRepo = { buscarPorFatura: vi.fn().mockResolvedValue([]), excluirPorFatura: vi.fn(), salvar: vi.fn() }
  const gastoRepo = {
    buscarPorFatura: vi.fn().mockResolvedValue([
      new Gasto({
        id: 'g1',
        faturaId: 'f1',
        descricao: 'Mercado',
        valorTotal: Dinheiro.deReais(100),
        compradorId: 'm1',
        divisoes: [
          new DivisaoDeGasto('m1', Dinheiro.deReais(50)),
          new DivisaoDeGasto('m2', Dinheiro.deReais(50))
        ],
        method: 'card',
        cardOwner: 'm1'
      })
    ])
  }
  const antecipacaoRepo = { buscarPorFatura: vi.fn().mockResolvedValue([]) }

  const service = new FaturaService(faturaRepo as any, acertoRepo as any, gastoRepo as any, antecipacaoRepo as any)
  await service.fecharFatura('f1', 'm1', new Date())

  expect(acertoRepo.salvar).toHaveBeenCalledTimes(1)
  expect(acertoRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({
    membroId: 'm2',
    totalConsumido: expect.objectContaining({ centavos: 5000 }),
    valorAcerto: expect.objectContaining({ centavos: 5000 }),
    tipo: 'MEMBRO_PAGA'
  }))
})

it('deve abater antecipacoes no fechamento da fatura', async () => {
  const fatura = new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'ABERTA' })
  const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
  const acertoRepo = { buscarPorFatura: vi.fn().mockResolvedValue([]), excluirPorFatura: vi.fn(), salvar: vi.fn() }
  const gastoRepo = {
    buscarPorFatura: vi.fn().mockResolvedValue([
      new Gasto({
        id: 'g1',
        faturaId: 'f1',
        descricao: 'Mercado',
        valorTotal: Dinheiro.deReais(300),
        compradorId: 'm1',
        divisoes: [new DivisaoDeGasto('m2', Dinheiro.deReais(300))],
        method: 'card',
        cardOwner: 'm1'
      })
    ])
  }
  const antecipacaoRepo = {
    buscarPorFatura: vi.fn().mockResolvedValue([
      { membroId: 'm2', valor: Dinheiro.deReais(100) }
    ])
  }

  const service = new FaturaService(faturaRepo as any, acertoRepo as any, gastoRepo as any, antecipacaoRepo as any)
  await service.fecharFatura('f1', 'm1', new Date())

  expect(acertoRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({
    membroId: 'm2',
    totalConsumido: expect.objectContaining({ centavos: 30000 }),
    totalAntecipado: expect.objectContaining({ centavos: 10000 }),
    valorAcerto: expect.objectContaining({ centavos: 20000 }),
    tipo: 'MEMBRO_PAGA'
  }))
})
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npx vitest run src/models/services/FaturaService.test.ts`

Expected: FAIL because `FaturaService` constructor does not accept anticipation repo and does not skip responsible member.

- [ ] **Step 3: Update FaturaService constructor and calculation**

In `src/models/services/FaturaService.ts`, import the repository:

```ts
import type { IAntecipacaoFaturaRepository } from '../repositories/IAntecipacaoFaturaRepository'
```

Change constructor:

```ts
constructor(
  private faturaRepo: IFaturaRepository,
  private acertoRepo: IAcertoMembroRepository,
  private gastoRepo: IGastoRepository,
  private antecipacaoRepo?: IAntecipacaoFaturaRepository
) {}
```

Inside `fecharFatura`, after `const gastos = await this.gastoRepo.buscarPorFatura(faturaId)`, add:

```ts
const responsavelFinalId = responsavelId || fatura.responsavelId
const antecipacoes = this.antecipacaoRepo ? await this.antecipacaoRepo.buscarPorFatura(faturaId) : []
const antecipacoesPorMembro: Record<string, number> = {}
for (const ant of antecipacoes) {
  antecipacoesPorMembro[ant.membroId] = (antecipacoesPorMembro[ant.membroId] || 0) + ant.valor.centavos
}
```

Replace the acerto creation loop with:

```ts
for (const [membroId, centavos] of Object.entries(consumoMembros)) {
  if (membroId === responsavelFinalId) continue

  const totalAntecipado = antecipacoesPorMembro[membroId] || 0
  const liquido = centavos - totalAntecipado
  if (liquido === 0) continue

  const antigo = acertosAntigos.find(a => a.membroId === membroId)
  const acerto = new AcertoMembro({
    id: antigo?.id || crypto.randomUUID(),
    faturaId,
    membroId,
    totalConsumido: Dinheiro.deCentavos(centavos),
    totalAntecipado: Dinheiro.deCentavos(totalAntecipado),
    valorPago: antigo?.valorPago,
    pago: antigo?.pago,
    dataPagamento: antigo?.dataPagamento
  })
  await this.acertoRepo.salvar(acerto)
}
```

- [ ] **Step 4: Wire the repo in container**

In `src/shared/container.ts`, change:

```ts
export const faturaService = new FaturaService(faturaRepository, acertoMembroRepository, gastoRepository)
```

to:

```ts
export const faturaService = new FaturaService(faturaRepository, acertoMembroRepository, gastoRepository, antecipacaoFaturaRepository)
```

- [ ] **Step 5: Verify**

Run:

```powershell
npx vitest run src/models/services/FaturaService.test.ts
npm run build
```

Expected: tests PASS and build PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/models/services/FaturaService.ts src/models/services/FaturaService.test.ts src/shared/container.ts
git commit -m "fix: generate invoice settlements from net consumption"
```

---

### Task 4: Split Real Payable Balance From Open Card Forecast

**Files:**
- Create: `src/models/services/DashboardSaldoService.ts`
- Create: `src/models/services/DashboardSaldoService.test.ts`
- Modify: `src/viewmodels/useDashboardNetting.ts`
- Modify: `src/viewmodels/useDashboardViewModel.ts`

- [ ] **Step 1: Write pure service tests**

Create `src/models/services/DashboardSaldoService.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { Fatura } from '../entities/Fatura'
import { Gasto } from '../entities/Gasto'
import { Dinheiro } from '../entities/Dinheiro'
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto'
import { separarGastosSaldoRealEPreviaCartao, calcularPreviaCartaoAberto } from './DashboardSaldoService'

describe('DashboardSaldoService', () => {
  const faturaPix = new Fatura({ id: 'pix-maio', cartaoId: 'PIX_DEFAULT_ID', periodo: { mes: 5, ano: 2026 }, responsavelId: 'PIX_SYSTEM_OWNER', status: 'ABERTA' })
  const faturaCartaoAberta = new Fatura({ id: 'card-maio', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'luan', status: 'ABERTA' })
  const faturaCartaoFechada = new Fatura({ id: 'card-abril', cartaoId: 'c1', periodo: { mes: 4, ano: 2026 }, responsavelId: 'luan', status: 'FECHADA' })

  it('deve manter pix no saldo real e cartao aberto fora do saldo real', () => {
    const pix = new Gasto({
      id: 'g-pix',
      faturaId: 'pix-maio',
      descricao: 'Mercado pix',
      valorTotal: Dinheiro.deReais(100),
      compradorId: 'luan',
      divisoes: [new DivisaoDeGasto('joao', Dinheiro.deReais(100))],
      method: 'pix'
    })
    const card = new Gasto({
      id: 'g-card',
      faturaId: 'card-maio',
      descricao: 'Mercado cartao',
      valorTotal: Dinheiro.deReais(300),
      compradorId: 'luan',
      divisoes: [new DivisaoDeGasto('joao', Dinheiro.deReais(300))],
      method: 'card',
      cardOwner: 'luan'
    })

    const result = separarGastosSaldoRealEPreviaCartao([pix, card], [faturaPix, faturaCartaoAberta])

    expect(result.gastosSaldoReal.map(g => g.id)).toEqual(['g-pix'])
    expect(result.gastosPrevisaoCartao.map(g => g.id)).toEqual(['g-card'])
  })

  it('deve deixar gastos brutos de fatura fechada fora do saldo real porque a divida vem de AcertoMembro', () => {
    const cardFechado = new Gasto({
      id: 'g-card-fechado',
      faturaId: 'card-abril',
      descricao: 'Cartao fechado',
      valorTotal: Dinheiro.deReais(300),
      compradorId: 'luan',
      divisoes: [new DivisaoDeGasto('joao', Dinheiro.deReais(300))],
      method: 'card',
      cardOwner: 'luan'
    })

    const result = separarGastosSaldoRealEPreviaCartao([cardFechado], [faturaCartaoFechada])

    expect(result.gastosSaldoReal).toEqual([])
    expect(result.gastosPrevisaoCartao).toEqual([])
  })

  it('deve calcular previa de cartao aberto por membro', () => {
    const card = new Gasto({
      id: 'g-card',
      faturaId: 'card-maio',
      descricao: 'Mercado cartao',
      valorTotal: Dinheiro.deReais(300),
      compradorId: 'luan',
      divisoes: [
        new DivisaoDeGasto('joao', Dinheiro.deReais(200)),
        new DivisaoDeGasto('maria', Dinheiro.deReais(100))
      ],
      method: 'card',
      cardOwner: 'luan'
    })

    expect(calcularPreviaCartaoAberto([card])).toEqual({
      joao: 20000,
      maria: 10000
    })
  })
})
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `npx vitest run src/models/services/DashboardSaldoService.test.ts`

Expected: FAIL because the service file does not exist.

- [ ] **Step 3: Create DashboardSaldoService**

Create `src/models/services/DashboardSaldoService.ts`:

```ts
import type { Fatura } from '../entities/Fatura'
import type { Gasto } from '../entities/Gasto'
import { valorParcelaAtual } from '../entities/ParcelaCalculator'

export interface SeparacaoGastosDashboard {
  gastosSaldoReal: Gasto[]
  gastosPrevisaoCartao: Gasto[]
}

export function separarGastosSaldoRealEPreviaCartao(
  gastos: Gasto[],
  faturas: Fatura[]
): SeparacaoGastosDashboard {
  const faturasPorId = new Map(faturas.map(f => [f.id, f]))
  const gastosSaldoReal: Gasto[] = []
  const gastosPrevisaoCartao: Gasto[] = []

  for (const gasto of gastos) {
    const fatura = faturasPorId.get(gasto.faturaId)
    const ehCartao = gasto.method === 'card' || !!gasto.cardOwner

    if (gasto.isSettlement || gasto.isLoan || !ehCartao) {
      gastosSaldoReal.push(gasto)
      continue
    }

    if (ehCartao && fatura?.status === 'ABERTA') {
      gastosPrevisaoCartao.push(gasto)
    }
  }

  return { gastosSaldoReal, gastosPrevisaoCartao }
}

export function calcularPreviaCartaoAberto(gastos: Gasto[]): Record<string, number> {
  const totalPorMembro: Record<string, number> = {}

  for (const gasto of gastos) {
    for (const div of gasto.divisoes) {
      const valor = valorParcelaAtual(div.valor, gasto.installments, gasto.totalInstallments)
      if (valor.centavos > 0) {
        totalPorMembro[div.membroId] = (totalPorMembro[div.membroId] || 0) + valor.centavos
      }
    }
  }

  return totalPorMembro
}
```

- [ ] **Step 4: Update useDashboardNetting signature**

In `src/viewmodels/useDashboardNetting.ts`, change the function signature:

```ts
export function useDashboardNetting(
  getMembros: () => { id: string; nome: string; ativo?: boolean }[],
  gastosSaldoReal: Ref<any[]>
) {
```

Then replace `gastosFaturaSelecionada.value` with `gastosSaldoReal.value`.

- [ ] **Step 5: Expose split data in DashboardViewModel**

In `src/viewmodels/useDashboardViewModel.ts`, import:

```ts
import { calcularPreviaCartaoAberto, separarGastosSaldoRealEPreviaCartao } from '../models/services/DashboardSaldoService'
```

Add computed values after `gastosFaturaSelecionada`:

```ts
const faturasPeriodoSelecionadoLista = computed(() => periodos.faturasPeriodoSelecionado.value)

const separacaoDashboard = computed(() =>
  separarGastosSaldoRealEPreviaCartao(gastosFaturaSelecionada.value, faturasPeriodoSelecionadoLista.value)
)

const gastosSaldoRealSelecionado = computed(() => separacaoDashboard.value.gastosSaldoReal)
const gastosPrevisaoCartaoAberto = computed(() => separacaoDashboard.value.gastosPrevisaoCartao)
const previaCartaoAbertoPorMembroCentavos = computed(() => calcularPreviaCartaoAberto(gastosPrevisaoCartaoAberto.value))
const totalPreviaCartaoAbertoCentavos = computed(() =>
  Object.values(previaCartaoAbertoPorMembroCentavos.value).reduce((acc, val) => acc + val, 0)
)
```

Change:

```ts
const netting = useDashboardNetting(() => props.membros, gastosFaturaSelecionada)
```

to:

```ts
const netting = useDashboardNetting(() => props.membros, gastosSaldoRealSelecionado)
```

Return the new values:

```ts
gastosSaldoRealSelecionado,
gastosPrevisaoCartaoAberto,
previaCartaoAbertoPorMembroCentavos,
totalPreviaCartaoAbertoCentavos,
```

- [ ] **Step 6: Verify**

Run:

```powershell
npx vitest run src/models/services/DashboardSaldoService.test.ts src/models/services/NettingService.test.ts src/viewmodels/useDashboardViewModel.test.ts
npm run build
```

Expected: tests PASS and build PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/models/services/DashboardSaldoService.ts src/models/services/DashboardSaldoService.test.ts src/viewmodels/useDashboardNetting.ts src/viewmodels/useDashboardViewModel.ts
git commit -m "fix: separate payable balance from open card forecast"
```

---

### Task 5: Encerrar Mês Must Not Close Card Invoices

**Files:**
- Modify: `src/models/services/FaturaRolloverService.ts`
- Test: `src/models/services/FaturaRolloverService.test.ts`
- Modify: `src/viewmodels/useDashboardViewModel.ts`

- [ ] **Step 1: Replace rollover behavior test**

In `src/models/services/FaturaRolloverService.test.ts`, replace the test named `deve fechar faturas antigas e criar novas faturas no rollover de periodo` with:

```ts
it('nao deve fechar faturas abertas ao encerrar periodo', async () => {
  const mockFaturaRepo = { buscarPorId: vi.fn(), buscarPorCartaoEPeriodo: vi.fn(), salvar: vi.fn(), listarTodas: vi.fn() }
  const mockGastoRepo = { salvar: vi.fn(), buscarPorFatura: vi.fn().mockResolvedValue([]), excluir: vi.fn(), listarTodos: vi.fn(), buscarPorId: vi.fn() }
  const faturaAberta = new Fatura({
    id: 'f-antiga',
    cartaoId: 'c1',
    periodo: { mes: 5, ano: 2026 },
    responsavelId: 'm1',
    status: 'ABERTA'
  })
  const mockFaturaService = {
    fecharFatura: vi.fn().mockResolvedValue(undefined),
    reabrirFatura: vi.fn(),
    assegurarFaturasAbertas: vi.fn()
  }
  const service = new FaturaRolloverService(mockFaturaRepo as any, mockGastoRepo as any, mockFaturaService as any)

  await service.executarRolloverPeriodo({
    nomeNovoPeriodo: 'Junho 2026',
    faturasAbertas: [faturaAberta],
    cartoes: [{ id: 'c1', responsavelPadraoId: 'm1' }],
    saldosAcumulados: { m1: 0 },
    nomePeriodoAnterior: 'Maio 2026'
  })

  expect(mockFaturaService.fecharFatura).not.toHaveBeenCalled()
  expect(mockFaturaRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({
    cartaoId: 'PIX_DEFAULT_ID',
    periodo: { mes: 6, ano: 2026 },
    status: 'ABERTA'
  }))
  expect(mockFaturaRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({
    cartaoId: 'c1',
    periodo: { mes: 6, ano: 2026 },
    status: 'ABERTA'
  }))
})
```

- [ ] **Step 2: Run test and confirm failure**

Run: `npx vitest run src/models/services/FaturaRolloverService.test.ts`

Expected: FAIL because `executarRolloverPeriodo` currently calls `fecharFatura`.

- [ ] **Step 3: Remove automatic invoice closing from rollover**

In `src/models/services/FaturaRolloverService.ts`, delete this block:

```ts
// 1. Fechar as faturas abertas do periodo via FaturaService para gerar acertos
for (const f of faturasAbertas) {
  await this.faturaService.fecharFatura(f.id, f.responsavelId, new Date())
}
```

Keep the rest of the method creating the next period and carrying over only the `saldosAcumulados` passed by the dashboard.

- [ ] **Step 4: Rename user-facing data in DashboardViewModel call**

In `src/viewmodels/useDashboardViewModel.ts`, ensure `confirmarNovoPeriodo` passes only real payable balance:

```ts
saldosAcumulados: netting.saldosUnificadosAtivosCentavos.value,
```

This should already point to `gastosSaldoRealSelecionado` after Task 4. Add this comment directly above the call:

```ts
// Encerrar mes carrega apenas saldos reais. Faturas de cartao abertas seguem como previsao.
```

- [ ] **Step 5: Verify**

Run:

```powershell
npx vitest run src/models/services/FaturaRolloverService.test.ts src/viewmodels/useDashboardViewModel.test.ts
npm run build
```

Expected: tests PASS and build PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/models/services/FaturaRolloverService.ts src/models/services/FaturaRolloverService.test.ts src/viewmodels/useDashboardViewModel.ts
git commit -m "fix: keep invoice state unchanged when closing month"
```

---

### Task 6: Minimal Dashboard UI Separation

**Files:**
- Modify: `src/views/screens/DashboardSaldos.vue`
- Test: `src/views/screens/DashboardSaldos.test.ts`

- [ ] **Step 1: Add UI test for open-card forecast label**

Append to `src/views/screens/DashboardSaldos.test.ts`:

```ts
it('deve exibir previa de faturas abertas separada do saldo real', async () => {
  const wrapper = mount(DashboardSaldos, {
    props: {
      membros: [{ id: 'luan', nome: 'Luan' }, { id: 'joao', nome: 'Joao' }],
      faturasAbertas: [
        new Fatura({ id: 'pix-maio', cartaoId: 'PIX_DEFAULT_ID', periodo: { mes: 5, ano: 2026 }, responsavelId: 'PIX_SYSTEM_OWNER', status: 'ABERTA' }),
        new Fatura({ id: 'card-maio', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'luan', status: 'ABERTA' })
      ],
      faturasFechadas: [],
      acertosPendentes: [],
      cartoes: [new Cartao({ id: 'c1', nome: 'Nubank', diaFechamento: 10, responsavelPadraoId: 'luan' })],
      calcularConsumo: () => 0,
      activeTab: 'faturas'
    }
  })

  expect(wrapper.text()).toContain('Previa de faturas abertas')
  expect(wrapper.text()).toContain('Nao e cobranca final')
})
```

Use existing imports in the file. If `mount`, `Fatura`, or `Cartao` are not imported, add:

```ts
import { mount } from '@vue/test-utils'
import { Fatura } from '../../models/entities/Fatura'
import { Cartao } from '../../models/entities/Cartao'
```

- [ ] **Step 2: Run test and confirm failure**

Run: `npx vitest run src/views/screens/DashboardSaldos.test.ts`

Expected: FAIL because the labels are not rendered yet.

- [ ] **Step 3: Render minimal forecast block**

In `src/views/screens/DashboardSaldos.vue`, destructure these values from `vm`:

```ts
previaCartaoAbertoPorMembroCentavos,
totalPreviaCartaoAbertoCentavos,
```

Add this section in the `FATURAS` group before `DetalhamentoSaldosCard`:

```vue
<Card v-if="totalPreviaCartaoAbertoCentavos > 0" class="p-6 space-y-4">
  <div>
    <h3 class="font-bold text-lg leading-tight text-charcoal">Previa de faturas abertas</h3>
    <p class="text-xs text-ash mt-1">Nao e cobranca final. Estes valores viram acerto quando a fatura for fechada.</p>
  </div>

  <div class="grid gap-2">
    <div
      v-for="m in membrosAtivos"
      :key="m.id"
      class="flex items-center justify-between rounded-xl bg-parchment px-4 py-3"
    >
      <span class="text-sm font-semibold text-charcoal">{{ m.nome }}</span>
      <span class="text-sm font-bold text-ash">
        R$ {{ ((previaCartaoAbertoPorMembroCentavos[m.id] || 0) / 100).toFixed(2).replace('.', ',') }}
      </span>
    </div>
  </div>
</Card>
```

- [ ] **Step 4: Update existing copy for Encerrar Mês**

In the banner copy, replace:

```vue
Encerre este mes para gerar as faturas e iniciar o proximo periodo.
```

with:

```vue
Encerre este mes para arquivar o periodo e iniciar o proximo. Faturas abertas continuam como previsao.
```

Keep accents consistent with the surrounding file encoding if editing manually.

- [ ] **Step 5: Verify**

Run:

```powershell
npx vitest run src/views/screens/DashboardSaldos.test.ts
npm run build
```

Expected: tests PASS and build PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/views/screens/DashboardSaldos.vue src/views/screens/DashboardSaldos.test.ts
git commit -m "feat: show open card forecast separately"
```

---

### Task 7: Final Regression Pass

**Files:**
- No planned source edits unless tests expose defects from earlier tasks.

- [ ] **Step 1: Run all frontend tests**

Run: `npx vitest run`

Expected: all tests PASS.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: build PASS.

- [ ] **Step 3: Run backend build or tests**

Run:

```powershell
cd backend
npm run build
```

Expected: backend build PASS. If `backend/package.json` does not define `build`, run `npx tsc -p tsconfig.json --noEmit`.

- [ ] **Step 4: Manual smoke scenario**

Use the app manually with local dev server:

```powershell
npm run dev
```

Verify:

1. Launch a Pix expense. It appears in real balance.
2. Launch a card expense. It appears only in open-card forecast.
3. Close the card invoice. It creates `AcertoMembro`.
4. Close the month. It opens the next period without closing still-open invoices automatically.

- [ ] **Step 5: Commit any regression fixes**

If Step 1-4 required code changes:

```powershell
git status --short
git add src backend
git commit -m "fix: stabilize invoice period flow regressions"
```

If no changes were required, do not create an empty commit.
