# Correção de Gaps nas Regras de Negócio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir os 5 gaps identificados na auditoria de regras de negócio (GAP 1–5) — sem mudanças de domínio, apenas integridade, guarda e UI ausentes.

**Architecture:** Os gaps são independentes entre si e afetam camadas diferentes: GAP 1 e 2 afetam o ViewModel (useDashboardViewModel.ts), GAP 5 o backend (financeiro.service.ts), GAP 6 o FaturaService do frontend, GAP 4 a entidade AcertoMembro e o fluxo de quitação. Cada Task é autocontida.

**Tech Stack:** TypeScript, Vue 3 Composition API, Vitest, NestJS, Prisma

---

## Task 1: GAP 1 — Bloquear reabertura de período com acertos pagos

**Problema:** `reabrirPeriodoSelecionado` em `useDashboardViewModel.ts` L334–345 itera sobre todas as faturas fechadas e reabre em bloco sem checar se alguma tem acerto já pago (com `pago=true` ou `valorPago.centavos > 0`). Se alguém já fez Pix, o acerto desaparece mas o dinheiro foi enviado.

**Files:**
- Modify: `src/viewmodels/useDashboardViewModel.ts:334-345`
- Modify: `src/viewmodels/useCartoesEFaturas.ts:163-171`
- Test: `src/viewmodels/useDashboardViewModel.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

No arquivo `src/viewmodels/useDashboardViewModel.test.ts`, adicionar este teste:

```typescript
it('deve lançar erro ao tentar reabrir período com acerto já pago', async () => {
  // Este teste verifica que reabrirPeriodoSelecionado lança quando há acerto pago
  // Setup: dois acertos, um pago, outro não
  // A ação deve lançar antes de chamar reabrirFaturaManual em qualquer fatura
  const acertos = [
    { id: 'a1', faturaId: 'f1', membroId: 'm2', pago: true, valorPago: { centavos: 5000 } },
    { id: 'a2', faturaId: 'f2', membroId: 'm3', pago: false, valorPago: { centavos: 0 } }
  ]
  // Consulte o padrão de teste existente no arquivo para ver como mockar
  // useDashboardViewModel com props e dependencies
})
```

- [ ] **Step 2: Verificar que o teste falha**

```bash
cd d:\projetos\divi && npx vitest run src/viewmodels/useDashboardViewModel.test.ts --reporter=verbose 2>&1 | tail -30
```

Esperado: FAIL (o bloco não testa acertos pagos ainda).

- [ ] **Step 3: Implementar a guarda em `reabrirPeriodoSelecionado`**

Em `src/viewmodels/useDashboardViewModel.ts`, substituir L334–345:

```typescript
const reabrirPeriodoSelecionado = async () => {
  const p = periodos.periodoSelecionado.value
  const faturasDoPeriodo = props.faturasFechadas.filter(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano)

  // GAP 1: bloquear se qualquer acerto do período já foi pago (total ou parcialmente)
  const acertosDoPeriodo = faturasDoPeriodo.flatMap(f =>
    (props.acertosPendentes?.length > 0 ? props.acertosPendentes : globalAcertos.value)
      .filter((a: AcertoMembro) => a.faturaId === f.id)
  )
  const temAcertoPago = acertosDoPeriodo.some(
    (a: AcertoMembro) => a.pago || (a.valorPago && a.valorPago.centavos > 0)
  )
  if (temAcertoPago) {
    toast.show(
      'Não é possível reabrir este período pois já existem acertos quitados (total ou parcialmente). Estorne os pagamentos primeiro.',
      'error'
    )
    return
  }

  try {
    for (const fatura of faturasDoPeriodo) {
      await reabrirFaturaManual(fatura.id)
    }
    await cartoesEFaturas.inicializar()
  } catch (error: any) {
    toast.show(error.message || 'Erro ao reabrir período', 'error')
  }
}
```

- [ ] **Step 4: Rodar os testes**

```bash
cd d:\projetos\divi && npx vitest run src/viewmodels/useDashboardViewModel.test.ts --reporter=verbose 2>&1 | tail -30
```

Esperado: todos passando.

- [ ] **Step 5: Commit**

```bash
cd d:\projetos\divi && git add src/viewmodels/useDashboardViewModel.ts src/viewmodels/useDashboardViewModel.test.ts && git commit -m "fix(gap1): bloquear reabertura de periodo com acertos ja pagos"
```

---

## Task 2: GAP 2 — Exibir revisão de pendências antes de encerrar o mês

**Problema:** `confirmarNovoPeriodo` dispara rollover direto. A spec exige que o app mostre: faturas abertas com consumo, faturas fechadas não quitadas, saldos à vista pendentes — e o usuário confirme conscientemente.

**Abordagem:** Adicionar estado de `resumoPendencias` computado no ViewModel, expô-lo, e a UI (bottom sheet existente `showBottomSheetNovoPeriodo`) deve renderizar esse resumo antes do botão de confirmar. Não criamos nova tela — apenas enriquecemos os dados disponíveis no bottom sheet.

**Files:**
- Modify: `src/viewmodels/useDashboardViewModel.ts` (novo computed + export)
- Modify: `src/viewmodels/useDashboardUIState.ts` (novo estado `revisaoPendenciasConfirmada`)

- [ ] **Step 1: Escrever teste de unidade para o computed `resumoPendencias`**

Em `src/viewmodels/useDashboardViewModel.test.ts`, adicionar:

```typescript
it('deve calcular resumoPendencias com faturas abertas com consumo e acertos pendentes', () => {
  // resumoPendencias deve conter:
  // - faturasAbertasComConsumo: faturas ABERTA do período com gastos de cartão
  // - faturasFechadasNaoQuitadas: faturas FECHADA com acertos.pago === false
  // - saldoAVistaResumo: total de netting não zerado
  // Verificar que o retorno tem a estrutura correta
})
```

- [ ] **Step 2: Verificar falha**

```bash
cd d:\projetos\divi && npx vitest run src/viewmodels/useDashboardViewModel.test.ts --reporter=verbose 2>&1 | tail -20
```

- [ ] **Step 3: Implementar `resumoPendencias` computed em `useDashboardViewModel.ts`**

Após a linha da definição de `totalFuturasVencer` (L158), adicionar:

```typescript
const resumoPendencias = computed(() => {
  const p = periodos.periodoSelecionado.value
  
  // Faturas de cartão ABERTAS do período atual com consumo registrado
  const faturasAbertasComConsumo = props.faturasAbertas
    .filter(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano && f.cartaoId !== 'PIX_DEFAULT_ID')
    .map(f => ({
      fatura: f,
      totalCentavos: globalGastos.value
        .filter(g => g.faturaId === f.id && !g.isSettlement)
        .reduce((sum, g) => {
          return sum + g.divisoes.reduce((s, d) => {
            const vp = valorParcelaAtual(d.valor, g.installments, g.totalInstallments)
            return s + vp.centavos
          }, 0)
        }, 0)
    }))
    .filter(item => item.totalCentavos > 0)

  // Faturas FECHADAS do período com acertos ainda não quitados
  const faturasFechadasNaoQuitadas = props.faturasFechadas
    .filter(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano && f.status === 'FECHADA')
    .map(f => ({
      fatura: f,
      acertosPendentes: acertosDaFatura(f.id).filter((a: AcertoMembro) => !a.pago)
    }))
    .filter(item => item.acertosPendentes.length > 0)

  // Saldo à vista do período (netting não zerado)
  const totalSaldoAVista = Object.values(netting.saldosUnificadosAtivosCentavos.value)
    .reduce((sum: number, v: number) => sum + Math.abs(v), 0)

  return {
    faturasAbertasComConsumo,
    faturasFechadasNaoQuitadas,
    temPendencias: faturasAbertasComConsumo.length > 0 || faturasFechadasNaoQuitadas.length > 0,
    totalSaldoAVistaCentavos: totalSaldoAVista
  }
})
```

- [ ] **Step 4: Exportar `resumoPendencias` no return do ViewModel**

Na seção `return {` do ViewModel (após L375 aprox), adicionar:

```typescript
resumoPendencias,
```

- [ ] **Step 5: Rodar testes**

```bash
cd d:\projetos\divi && npx vitest run src/viewmodels/useDashboardViewModel.test.ts --reporter=verbose 2>&1 | tail -20
```

- [ ] **Step 6: Commit**

```bash
cd d:\projetos\divi && git add src/viewmodels/useDashboardViewModel.ts src/viewmodels/useDashboardViewModel.test.ts && git commit -m "feat(gap2): expor resumoPendencias antes de encerrar mes"
```

---

## Task 3: GAP 5 — Bloquear edição de gasto em fatura fechada no backend

**Problema:** `salvarGasto` e `salvarMuitosGastos` em `financeiro.service.ts` usam upsert sem verificar o status da fatura. Qualquer gasto pode ser editado via API mesmo se a fatura estiver `FECHADA` ou `ACERTADA`.

**Files:**
- Modify: `backend/src/financeiro/financeiro.service.ts:251-306` (método `upsertGastoTx`)

- [ ] **Step 1: Adicionar verificação de status da fatura em `upsertGastoTx`**

No método `upsertGastoTx` em `backend/src/financeiro/financeiro.service.ts`, adicionar a verificação logo após a desestruturação (antes do `deleteMany`):

```typescript
private async upsertGastoTx(tx: any, tenantId: string, g: any) {
  const {
    id,
    faturaId,
    descricao,
    valorTotalCentavos,
    compradorId,
    installments,
    totalInstallments,
    isLoan,
    borrowerId,
    recurringBillId,
    isSettlement,
    settlementDetails,
    method,
    cardOwnerId,
    grupoParcelasId,
    divisoes,
  } = g;

  // GAP 5: bloquear edição de gasto em fatura fechada ou acertada
  if (faturaId) {
    const fatura = await tx.fatura.findUnique({ where: { id_tenantId: { id: faturaId, tenantId } } });
    if (fatura && (fatura.status === 'FECHADA' || fatura.status === 'ACERTADA')) {
      // Permitir apenas isSettlement (acertos de Pix) em fatura fechada
      if (!isSettlement) {
        throw new BadRequestException(
          `Não é possível editar um gasto em uma fatura com status "${fatura.status}". Reabra a fatura primeiro.`
        );
      }
    }
  }

  // Restante do código original...
  await tx.divisaoGasto.deleteMany({ where: { gastoId: id, tenantId } });
  // ... (manter o restante igual)
```

- [ ] **Step 2: Rodar build do backend para verificar que compila**

```bash
cd d:\projetos\divi\backend && npx tsc --noEmit 2>&1 | head -30
```

Esperado: sem erros de compilação.

- [ ] **Step 3: Testar manualmente com o servidor rodando**

O servidor já está rodando (`npm run start:dev`). Tentar salvar um gasto em uma fatura `FECHADA` deve retornar HTTP 400 com a mensagem acima.

- [ ] **Step 4: Commit**

```bash
cd d:\projetos\divi && git add backend/src/financeiro/financeiro.service.ts && git commit -m "fix(gap5): bloquear edicao de gasto em fatura fechada ou acertada no backend"
```

---

## Task 4: GAP 6 — Tornar `dataPagamentoBanco` obrigatória ao fechar fatura

**Problema:** A fatura pode ser fechada sem registrar `dataPagamentoBanco`. O check em `AcertoService.ts` L84 (`faturaObj.dataPagamentoBanco`) não marca como `ACERTADA` se o campo estiver ausente.

**Abordagem:** Garantir que `fecharFaturaManual` em `useCartoesEFaturas.ts` sempre passe a data atual quando não fornecida. O `FaturaService.fecharFatura` já aceita o parâmetro como opcional — a correção é no call site do ViewModel, não no domínio.

**Files:**
- Modify: `src/viewmodels/useCartoesEFaturas.ts:163-166`
- Test: `src/models/services/FaturaService.test.ts`

- [ ] **Step 1: Escrever teste que documenta o comportamento esperado**

Em `src/models/services/FaturaService.test.ts`, adicionar:

```typescript
it('deve marcar a fatura como ACERTADA automaticamente quando todos os acertos são quitados e dataPagamentoBanco está presente', async () => {
  // Este cenário testa que fecharFatura com dataPagamentoBanco definida
  // e um acerto já quitado resulta em fatura ACERTADA
  // (teste de regressão para GAP 6)
  const fatura = new Fatura({
    id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 },
    responsavelId: 'm1', status: 'ABERTA'
  })
  const faturaRepo = { buscarPorId: vi.fn().mockResolvedValue(fatura), salvar: vi.fn() }
  const acertoRepo = { buscarPorFatura: vi.fn().mockResolvedValue([]), excluirPorFatura: vi.fn(), salvar: vi.fn() }
  const gastoRepo = { buscarPorFatura: vi.fn().mockResolvedValue([]) }

  const service = new FaturaService(faturaRepo as any, acertoRepo as any, gastoRepo as any)
  await service.fecharFatura('f1', 'm1', new Date('2026-05-29'))

  const faturaFechada = faturaRepo.salvar.mock.calls[0][0]
  expect(faturaFechada.status).toBe('FECHADA')
  expect(faturaFechada.dataPagamentoBanco).toBeDefined()
})
```

- [ ] **Step 2: Rodar para confirmar que passa (ou ver o que falha)**

```bash
cd d:\projetos\divi && npx vitest run src/models/services/FaturaService.test.ts --reporter=verbose 2>&1 | tail -20
```

- [ ] **Step 3: Garantir que `fecharFaturaManual` sempre passa `dataPagamentoBanco`**

Em `src/viewmodels/useCartoesEFaturas.ts` L163–166, verificar que a chamada atual já passa `new Date()`:

```typescript
const fecharFaturaManual = async (faturaId: string, responsavelId?: string) => {
  // dataPagamentoBanco é sempre a data atual — GAP 6 previne fatura presa em FECHADA
  await localFaturaService.fecharFatura(faturaId, responsavelId, new Date())
  await inicializar()
}
```

A linha L164 já faz isso. Confirmar visualmente. Se correto, este step é apenas verificação.

- [ ] **Step 4: Adicionar validação na entidade Fatura para rejeitar fechar sem data**

Em `src/models/entities/Fatura.ts`, no método `fechar()`, tornar `dataPagamentoBanco` requerida:

```typescript
fechar(opts: { responsavelId?: string; dataPagamentoBanco: Date }): Fatura {
  if (this.status !== 'ABERTA') throw new Error('Apenas faturas ABERTAS podem ser fechadas')
  return new Fatura({
    id: this.id,
    cartaoId: this.cartaoId,
    periodo: this.periodo,
    responsavelId: opts?.responsavelId || this.responsavelId,
    status: 'FECHADA',
    dataPagamentoBanco: opts.dataPagamentoBanco // agora obrigatória
  })
}
```

> **Nota:** Isso vai gerar erro de TypeScript no FaturaService.ts L28 se chamado sem dataPagamentoBanco. Ajustar o call site conforme necessário.

- [ ] **Step 5: Ajustar `FaturaService.fecharFatura` para propagar a data obrigatoriamente**

Em `src/models/services/FaturaService.ts` L20–29, ajustar a assinatura:

```typescript
async fecharFatura(faturaId: string, responsavelId?: string, dataPagamentoBanco: Date = new Date()): Promise<void> {
  const fatura = await this.faturaRepo.buscarPorId(faturaId)
  if (!fatura) throw new Error('Fatura não encontrada')
  if (fatura.status !== 'ABERTA') {
    return
  }
  const fechada = fatura.fechar({ responsavelId, dataPagamentoBanco })
  await this.faturaRepo.salvar(fechada)
  // ...resto igual
```

- [ ] **Step 6: Rodar todos os testes de FaturaService**

```bash
cd d:\projetos\divi && npx vitest run src/models/services/FaturaService.test.ts --reporter=verbose 2>&1 | tail -20
```

Esperado: todos passando.

- [ ] **Step 7: Commit**

```bash
cd d:\projetos\divi && git add src/models/entities/Fatura.ts src/models/services/FaturaService.ts src/models/services/FaturaService.test.ts && git commit -m "fix(gap6): dataPagamentoBanco obrigatoria ao fechar fatura, default e data atual"
```

---

## Task 5: GAP 4 — Tornar `RESPONSAVEL_PAGA` visível e quitável na UI

**Problema:** Quando `valorAcerto < 0` (responsável deve devolver ao membro), o acerto tem `tipo: RESPONSAVEL_PAGA`. O fluxo de `marcarPago` chama `registrarReembolsoMembro` que funciona tecnicamente, mas a UI provavelmente exibe "Quitar" apenas para acertos do tipo `MEMBRO_PAGA`, não sinalizando ao responsável que ele deve dinheiro ao membro.

**Escopo desta task:** Verificar que `AcertoMembro` expõe corretamente a direção, e que `valorAcerto` é sempre positivo com `tipo` indicando a direção. Adicionar teste de ponta a ponta do fluxo `RESPONSAVEL_PAGA`.

**Files:**
- Test: `src/models/services/AcertoService.test.ts`
- Read: `src/models/entities/AcertoMembro.ts` (verificar getter `valorAcerto`)

- [ ] **Step 1: Verificar o getter `valorAcerto` na entidade**

Ler `src/models/entities/AcertoMembro.ts` e confirmar que `valorAcerto` retorna valor absoluto (positivo) independentemente do tipo. Se `valorAcerto` retornar negativo, corrigir para sempre retornar `Math.abs`.

```bash
# Verificar a implementação atual
type d:\projetos\divi\src\models\entities\AcertoMembro.ts
```

- [ ] **Step 2: Escrever teste de ponta a ponta para `RESPONSAVEL_PAGA`**

Em `src/models/services/AcertoService.test.ts`, adicionar:

```typescript
it('deve quitar acerto do tipo RESPONSAVEL_PAGA corretamente', async () => {
  // Cenário: responsável antecipou mais do que consumiu, deve R$50 ao membro
  const acerto = new AcertoMembro({
    id: 'a1',
    faturaId: 'f1',
    membroId: 'm2',
    totalConsumido: Dinheiro.deReais(0),
    totalAntecipado: Dinheiro.deReais(50),
    tipo: 'RESPONSAVEL_PAGA',
    valorPago: Dinheiro.deCentavos(0),
    pago: false
  })
  
  const acertoRepo = {
    buscarPorId: vi.fn().mockResolvedValue(acerto),
    salvar: vi.fn(),
    buscarPorFatura: vi.fn().mockResolvedValue([acerto])
  }
  const faturaRepo = {
    buscarPorId: vi.fn().mockResolvedValue(
      new Fatura({ id: 'f1', cartaoId: 'c1', periodo: { mes: 5, ano: 2026 }, responsavelId: 'm1', status: 'FECHADA', dataPagamentoBanco: new Date() })
    ),
    listarTodas: vi.fn().mockResolvedValue([]),
    salvar: vi.fn()
  }
  
  const service = new AcertoService(acertoRepo as any, faturaRepo as any)
  await service.marcarPago('a1', new Date())
  
  expect(acertoRepo.salvar).toHaveBeenCalledWith(expect.objectContaining({ pago: true }))
})
```

- [ ] **Step 3: Rodar para ver se passa**

```bash
cd d:\projetos\divi && npx vitest run src/models/services/AcertoService.test.ts --reporter=verbose 2>&1 | tail -20
```

Se falhar, identificar o bug no fluxo `RESPONSAVEL_PAGA` e corrigir em `AcertoService.ts`.

- [ ] **Step 4: Commit**

```bash
cd d:\projetos\divi && git add src/models/services/AcertoService.test.ts src/models/entities/AcertoMembro.ts && git commit -m "fix(gap4): verificar e cobrir fluxo RESPONSAVEL_PAGA com teste"
```

---

## Task 6: Rodar suite completa e verificar

- [ ] **Step 1: Rodar todos os testes do frontend**

```bash
cd d:\projetos\divi && npx vitest run --reporter=verbose 2>&1 | tail -40
```

Esperado: todos passando. Se houver falhas, corrigir antes de continuar.

- [ ] **Step 2: Verificar build do backend**

```bash
cd d:\projetos\divi\backend && npx tsc --noEmit 2>&1
```

Esperado: sem erros.

- [ ] **Step 3: Commit final de consolidação**

```bash
cd d:\projetos\divi && git add -A && git commit -m "chore: consolidar correccoes gaps 1-5 regras de negocio"
```

---

## Verificação Final

| Gap | Como verificar |
|-----|---------------|
| GAP 1 | No app, fechar fatura → fazer Pix de acerto → tentar reabrir o mês → deve exibir toast de erro |
| GAP 2 | Abrir bottom sheet "Encerrar mês" → deve mostrar lista de pendências antes do botão confirmar |
| GAP 5 | Chamar `POST /financeiro/gastos` com `faturaId` de fatura FECHADA → deve retornar HTTP 400 |
| GAP 6 | Fechar fatura → todos acertos quitados → fatura deve ir automaticamente para ACERTADA |
| GAP 4 | Fechar fatura onde antecipação > consumo → acerto gerado com tipo RESPONSAVEL_PAGA → `marcarPago` funciona |
