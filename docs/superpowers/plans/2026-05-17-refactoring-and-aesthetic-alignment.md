# Plano de Implementação: Refatoração, Limpeza e Alinhamento Estético com o DESIGN.md

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar a base de código do painel de finanças residenciais (Ledger) reduzindo a complexidade ciclomática de `DashboardSaldos.vue`, eliminando código e estilos redundantes, e realinhando completamente os componentes de revisão de fatura com o `DESIGN.md`.

**Architecture:** Extrair a lógica procedural de transição de período (`executarNovoPeriodo`) do componente visual `DashboardSaldos.vue` para o composable de domínio `useFaturaRollover.ts`. Remover classes obsoletas pré-fixadas com `divi-` nos quatro componentes de rateio e revisão, substituindo-as pelas variáveis de cor, formas, sombras internas (`shadow-subtle`) e tipografia estabelecidas no `DESIGN.md`.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), TypeScript, TailwindCSS v4, Vitest para verificação de regressões.

---

### Tarefa 1: Desacoplamento e Simplificação da Transição de Período (Rollover)

**Arquivos:**
- Modificar: `src/modules/ledger/composables/useFaturaRollover.ts`
- Modificar: `src/components/ledger/DashboardSaldos.vue`
- Teste: `src/modules/ledger/composables/useFaturaRollover.test.ts`

- [ ] **Passo 1: Adicionar a função de orquestração `executarRolloverPeriodo` em `useFaturaRollover.ts`**

Adicione os imports e a função `executarRolloverPeriodo` no arquivo `src/modules/ledger/composables/useFaturaRollover.ts`:

```typescript
import { LocalStorageFaturaRepository } from '../adapters/LocalStorageFaturaRepository'
import { LocalStorageGastoRepository } from '../adapters/LocalStorageGastoRepository'
import { Fatura } from '../core/domain/Fatura'
```

E no retorno do composable, implemente a função:

```typescript
  const executarRolloverPeriodo = async (
    nomeNovoPeriodo: string,
    faturasAbertas: Fatura[],
    cartoes: any[],
    saldosAcumulados: Record<string, number>,
    nomePeriodoAnterior: string,
    fecharFaturaManual: (faturaId: string) => Promise<void>
  ) => {
    if (faturasAbertas.length === 0) return

    // 1. Fechar as faturas abertas do período
    for (const f of faturasAbertas) {
      await fecharFaturaManual(f.id)
    }

    // 2. Criar faturas e período no novo mês
    const [mesStr, anoStr] = nomeNovoPeriodo.split(' ')
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    const mesNum = meses.indexOf(mesStr) + 1 || new Date().getMonth() + 1
    const anoNum = parseInt(anoStr) || new Date().getFullYear()

    const novasFaturas: Fatura[] = []
    const fRepo = new LocalStorageFaturaRepository()

    for (const card of cartoes) {
      const novaFatura = new Fatura({
        id: crypto.randomUUID(),
        cartaoId: card.id,
        periodo: { mes: mesNum, ano: anoNum },
        responsavelId: card.responsavelPadraoId,
        status: 'ABERTA'
      })
      await fRepo.salvar(novaFatura)
      novasFaturas.push(novaFatura)
    }

    const novaFaturaIdPrincipal = novasFaturas[0]?.id

    if (novaFaturaIdPrincipal) {
      const gRepo = new LocalStorageGastoRepository()

      // 3. Decrementar parcelas ativas
      const todosGastosAnteriores: Gasto[] = []
      for (const f of faturasAbertas) {
        const porFatura = await gRepo.buscarPorFatura(f.id)
        todosGastosAnteriores.push(...porFatura)
      }

      const gastosParceladosNovos = processarRolloverParcelas(novaFaturaIdPrincipal, todosGastosAnteriores)
      for (const g of gastosParceladosNovos) {
        await gRepo.salvar(g)
      }

      // 4. Aplicar Netting final e carregar saldos devedores/credores como "Saldo Inicial Pendente"
      const transacoesCarryover = gerarTransacoesNettingSaldoInicial(
        novaFaturaIdPrincipal, 
        nomePeriodoAnterior, 
        saldosAcumulados
      )
      for (const g of transacoesCarryover) {
        await gRepo.salvar(g)
      }
    }

    // 5. Destranca o período
    setMonthLocked(false)
  }
```

- [ ] **Passo 2: Simplificar o método `executarNovoPeriodo` no `DashboardSaldos.vue`**

Substitua as linhas 348 a 414 de `src/components/ledger/DashboardSaldos.vue` pela chamada ao composable:

```typescript
const executarNovoPeriodo = async (nomeNovoPeriodo: string) => {
  const { executarRolloverPeriodo } = useFaturaRollover()
  
  await executarRolloverPeriodo(
    nomeNovoPeriodo,
    props.faturasAbertas,
    props.cartoes,
    saldosUnificadosAtivos.value,
    currentMonthName.value,
    fecharFaturaManual
  )

  await useCartoesEFaturas().inicializar()
}
```

Remova imports de repositórios desnecessários do topo de `DashboardSaldos.vue`:
```typescript
// Remover estes imports pois não são mais usados no componente
import { LocalStorageGastoRepository } from '../../modules/ledger/adapters/LocalStorageGastoRepository'
import { LocalStorageFaturaRepository } from '../../modules/ledger/adapters/LocalStorageFaturaRepository'
import { Fatura } from '../../modules/ledger/core/domain/Fatura'
import { Gasto } from '../../modules/ledger/core/domain/Gasto'
```

- [ ] **Passo 3: Executar a suíte de testes do rollover**

Execute: `npx vitest run src/modules/ledger/composables/useFaturaRollover.test.ts`
Esperado: Todos os testes de rollover devem passar com sucesso.

---

### Tarefa 2: Refatoração Estética e Sanitização de `RevisaoFatura.vue`

**Arquivos:**
- Modificar: `src/components/ledger/dashboard/RevisaoFatura.vue`

- [ ] **Passo 1: Substituir as classes obsoletas `divi-` pelas variáveis oficiais e classes do `DESIGN.md`**

Altere a estilização do cabeçalho e contêineres em `src/components/ledger/dashboard/RevisaoFatura.vue`:

```html
<!-- Cabeçalho Principal -->
<div class="bg-card shadow-subtle border border-stone-surface p-6 rounded-cards flex flex-col md:flex-row md:justify-between md:items-center gap-4 text-graphite relative overflow-hidden">
  <div class="flex items-center gap-4">
    <button 
      @click="emit('voltar')"
      class="w-10 h-10 rounded-full bg-[#f6f4ef] hover:bg-stone-surface text-graphite font-bold flex items-center justify-center border border-stone-surface transition-all active:scale-95"
    >
      <ChevronLeft class="w-4 h-4" />
    </button>
    <div>
      <h2 class="text-xl font-semibold text-charcoal flex items-center gap-2">
        Revisão da Fatura
        <span class="text-[10px] bg-ember/15 text-ember border border-ember/20 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Fechada</span>
      </h2>
      <span class="text-xs text-ash font-medium block mt-1">
        Fatura do mês {{ props.fatura.periodo.mes }}/{{ props.fatura.periodo.ano }} • Total de R$ {{ totalFatura.toFixed(2).replace('.', ',') }}
      </span>
    </div>
  </div>

  <div class="flex gap-2">
    <button 
      @click="reabrirFatura"
      class="px-4 py-2.5 border border-coral-red/25 bg-coral-red/5 hover:bg-coral-red/10 text-coral-red rounded-xl text-xs font-semibold transition-all active:scale-95"
    >
      🔓 Reabrir Fatura
    </button>
    <button 
      @click="confirmarAcertos"
      :disabled="processandoConfirmacao"
      class="px-5 py-2.5 bg-midnight hover:bg-charcoal-primary disabled:bg-stone-surface disabled:text-smoke text-white rounded-buttonspill text-xs font-semibold transition-all active:scale-95 flex items-center gap-2"
    >
      <span v-if="processandoConfirmacao">Processando...</span>
      <span v-else>✅ Confirmar Acertos Pix</span>
    </button>
  </div>
</div>
```

E no grid principal:
```html
<div class="lg:col-span-7 bg-card shadow-subtle border border-stone-surface rounded-cards p-5 md:p-6 space-y-4 text-graphite">
```

- [ ] **Passo 2: Adicionar import da seta `ChevronLeft`**
No bloco `<script setup>`, importe `ChevronLeft` de `lucide-vue-next` para o botão de voltar.

---

### Tarefa 3: Refatoração Estética de `ListaGastosRevisao.vue`

**Arquivos:**
- Modificar: `src/components/ledger/dashboard/ListaGastosRevisao.vue`

- [ ] **Passo 1: Atualizar as classes e estruturas em `ListaGastosRevisao.vue`**

Substitua as classes obsoletas pelas classes premium do `DESIGN.md`:

```html
<template>
  <div class="space-y-3">
    <div class="flex justify-between items-center border-b border-stone-surface pb-2">
      <span class="text-xs font-bold uppercase text-ash tracking-wider">Itens da Fatura (Extrato)</span>
      <span class="text-[10px] text-charcoal font-bold bg-stone-surface border border-stone-surface px-2.5 py-0.5 rounded-full">{{ props.gastos.length }} compras</span>
    </div>

    <div v-if="props.gastos.length === 0" class="text-center py-8 bg-stone-surface/30 rounded-cards border border-dashed border-stone-surface">
      <span class="text-2xl block mb-1">🛒</span>
      <strong class="text-xs text-ash block">Nenhuma compra registrada nesta fatura.</strong>
    </div>

    <div v-else class="space-y-2">
      <div 
        v-for="g in props.gastos" 
        :key="g.id"
        class="flex justify-between items-center bg-[#fbfaf9] border border-stone-surface hover:border-ember/30 p-3 rounded-cards transition-all group hover:bg-white duration-150"
      >
        <div class="flex items-center gap-2.5 flex-1 min-w-0">
          <!-- Avatar Compacto -->
          <div 
            class="w-8 h-8 rounded-full bg-stone-surface text-charcoal font-bold text-xs flex items-center justify-center border border-stone-surface shrink-0"
          >
            {{ getCompradorNome(g.compradorId)[0].toUpperCase() }}
          </div>

          <!-- Dados do Gasto -->
          <div class="min-w-0 flex-1">
            <div class="flex items-baseline gap-2">
              <strong class="text-xs font-bold text-charcoal truncate leading-tight">{{ g.descricao }}</strong>
            </div>
            <span class="text-[9px] text-ash font-medium block mt-0.5">{{ formatarDivisao(g) }}</span>
          </div>
        </div>

        <!-- Valor e Ações -->
        <div class="flex items-center gap-3 shrink-0">
          <div class="text-right">
            <strong class="text-xs font-bold text-charcoal">R$ {{ (g.valorTotal.centavos / 100).toFixed(2).replace('.', ',') }}</strong>
          </div>

          <button 
            type="button"
            @click="emit('editarRateio', g)"
            class="px-3 py-1.5 bg-[#f6f4ef] hover:bg-stone-surface border border-stone-surface rounded-buttonspill text-[9px] font-semibold text-midnight transition-all active:scale-95 duration-150"
          >
            ✂️ Ratear
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
```

---

### Tarefa 4: Refatoração Estética de `PreviaAcertos.vue`

**Arquivos:**
- Modificar: `src/components/ledger/dashboard/PreviaAcertos.vue`

- [ ] **Passo 1: Eliminar referências de classes `divi-` e aplicar cores adequadas para saldos (Meadow Green / Coral Red)**

Substitua o template em `src/components/ledger/dashboard/PreviaAcertos.vue` pelas seguintes classes oficiais:

```html
<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center border-b border-stone-surface pb-1.5">
      <span class="text-xs font-bold uppercase text-ash tracking-wider">Prévia de Acertos (Saldos Coletivos)</span>
      <span class="text-[9px] text-ember font-bold bg-ember/15 border border-ember/20 px-2 py-0.5 rounded">Reativo</span>
    </div>

    <!-- Tabela de Consumos e Adiantamentos Individuais -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5">
      <div 
        v-for="s in saldosLiquidos" 
        :key="s.id"
        :class="[
          'p-3.5 rounded-cards border transition-all flex flex-col justify-between space-y-2.5 bg-card shadow-subtle',
          s.id === props.responsavelId ? 'border-ember/40 bg-ember/5' : 'border-stone-surface'
        ]"
      >
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-stone-surface border border-stone-surface font-bold text-[9px] flex items-center justify-center text-charcoal">
              {{ s.nome[0].toUpperCase() }}
            </div>
            <strong class="text-xs text-charcoal font-bold">{{ s.nome }}</strong>
          </div>
          <span 
            v-if="s.id === props.responsavelId" 
            class="text-[8px] bg-ember/15 text-ember font-bold border border-ember/20 px-1.5 py-0.5 rounded uppercase"
          >
            Quitou Fatura
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-[9px]">
          <div>
            <span class="text-ash font-medium block">Consumido:</span>
            <strong class="text-charcoal font-bold">R$ {{ s.consumo.toFixed(2).replace('.', ',') }}</strong>
          </div>
          <div>
            <span class="text-ash font-medium block">Adiantado:</span>
            <strong class="text-charcoal font-bold">R$ {{ s.antecipado.toFixed(2).replace('.', ',') }}</strong>
          </div>
        </div>

        <div class="pt-1.5 border-t border-stone-surface flex justify-between items-center text-[10px]">
          <span class="text-ash font-bold">Líquido:</span>
          <strong 
            :class="[
              'font-semibold',
              s.balanco > 0 ? 'text-coral-red' : s.balanco < 0 ? 'text-meadow-green' : 'text-smoke'
            ]"
          >
            {{ s.balanco > 0 ? `Deve R$ ${s.balanco.toFixed(2).replace('.', ',')}` : s.balanco < 0 ? `Crédito R$ ${Math.abs(s.balanco).toFixed(2).replace('.', ',')}` : 'Zerado' }}
          </strong>
        </div>
      </div>
    </div>

    <!-- Fluxo Pix Recomendado (Quem Paga Quem) -->
    <div class="bg-card shadow-subtle border border-stone-surface text-graphite rounded-cards p-4 space-y-3">
      <div class="flex items-center gap-2">
        <span class="text-base">💸</span>
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-charcoal">Fluxo do Acerto (Pix)</h4>
          <span class="text-[9px] text-ash font-bold block mt-0.5">Transferências calculadas para acerto de contas</span>
        </div>
      </div>

      <div v-if="transferenciasPix.length === 0" class="text-center py-3 text-xs text-ash">
        ⚖️ Contas zeradas! Não há necessidade de transferências Pix.
      </div>

      <div class="space-y-2" v-else>
        <div 
          v-for="(t, idx) in transferenciasPix" 
          :key="idx"
          class="flex items-center justify-between bg-stone-surface/30 border border-stone-surface p-3 rounded-cards"
        >
          <!-- Remetente -->
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <div class="w-8 h-8 rounded-full bg-stone-surface border border-stone-surface font-bold text-xs text-charcoal flex items-center justify-center shrink-0">
              {{ t.deNome[0].toUpperCase() }}
            </div>
            <div class="min-w-0">
              <strong class="text-xs font-bold block truncate leading-tight">{{ t.deNome }}</strong>
              <span class="text-[8px] text-ash font-medium">envia Pix</span>
            </div>
          </div>

          <!-- Seta com Direção e Valor -->
          <div class="flex flex-col items-center justify-center px-3 shrink-0">
            <span class="text-xs font-semibold text-ember">R$ {{ t.valor.toFixed(2).replace('.', ',') }}</span>
            <span class="text-xs tracking-widest text-ash/30 mt-0.5">➔➔➔</span>
          </div>

          <!-- Destinatário -->
          <div class="flex items-center gap-2 flex-1 justify-end min-w-0 text-right">
            <div class="min-w-0">
              <strong class="text-xs font-bold block truncate leading-tight">{{ t.paraNome }}</strong>
              <span class="text-[8px] text-ash font-medium">recebe Pix</span>
            </div>
            <div class="w-8 h-8 rounded-full bg-stone-surface border border-stone-surface font-bold text-xs text-charcoal flex items-center justify-center shrink-0">
              {{ t.paraNome[0].toUpperCase() }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

---

### Tarefa 5: Refatoração Estética de `ModalDivisaoGasto.vue`

**Arquivos:**
- Modificar: `src/components/ledger/dashboard/ModalDivisaoGasto.vue`

- [ ] **Passo 1: Substituir os estilos do modal de rateio**

Refatore o template do modal em `src/components/ledger/dashboard/ModalDivisaoGasto.vue` aplicando os padrões premium (fundo translúcido Midnight, sombras suaves, inputs táteis):

```html
<template>
  <div 
    v-if="show && props.gasto" 
    class="fixed inset-0 bg-midnight/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
  >
    <div class="bg-card shadow-lg w-full max-w-md rounded-cards p-6 border border-stone-surface flex flex-col max-h-[90vh] text-graphite">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6 border-b border-stone-surface pb-4">
        <div>
          <h3 class="text-lg font-bold text-charcoal">Rateio & Comprador</h3>
          <span class="text-xs text-ash font-bold block mt-1">Ajuste de rateio de forma simples</span>
        </div>
        <button 
          @click="emit('close')"
          class="w-8 h-8 rounded-full bg-stone-surface hover:bg-stone text-ash hover:text-charcoal font-bold flex items-center justify-center transition-all"
        >
          ✕
        </button>
      </div>

      <!-- Info Gasto -->
      <div class="bg-stone-surface border border-stone-surface rounded-cards p-4 mb-5 flex justify-between items-center">
        <div>
          <span class="text-[10px] uppercase font-bold tracking-widest text-ember">Gasto sob Revisão</span>
          <strong class="block text-charcoal text-sm mt-0.5">{{ props.gasto.descricao }}</strong>
        </div>
        <div class="text-right">
          <span class="text-xs font-bold text-ash">Valor</span>
          <strong class="block text-ember text-lg font-bold">R$ {{ (props.gasto.valorTotal.centavos / 100).toFixed(2).replace('.', ',') }}</strong>
        </div>
      </div>

      <div class="space-y-5 overflow-y-auto flex-1 pr-1">
        <!-- 1. Comprador -->
        <div class="space-y-2">
          <label class="text-xs font-bold uppercase text-ash tracking-wider block">Quem Comprou (Dono do gasto)</label>
          <SeletorMembros 
            :membros="props.membros"
            v-model="compradorId"
          />
        </div>

        <!-- 2. Rateio e Divisão -->
        <div class="bg-stone-surface/30 border border-stone-surface rounded-cards p-4 space-y-4">
          <div class="flex justify-between items-center pb-2 border-b border-stone-surface">
            <span class="text-xs font-bold uppercase text-ash tracking-wider">Configurar Rateio</span>
            <div class="flex bg-stone-surface p-0.5 rounded-lg border border-stone-surface">
              <button 
                type="button"
                @click="setModo('IGUAL')"
                :class="[
                  'text-[10px] font-bold px-2.5 py-1 rounded-md transition-all',
                  modo === 'IGUAL' ? 'bg-midnight text-white shadow-sm' : 'text-ash hover:text-charcoal'
                ]"
              >
                ⚖️ Igual
              </button>
              <button 
                type="button"
                @click="setModo('MANUAL')"
                :class="[
                  'text-[10px] font-bold px-2.5 py-1 rounded-md transition-all',
                  modo === 'MANUAL' ? 'bg-midnight text-white shadow-sm' : 'text-ash hover:text-charcoal'
                ]"
              >
                ✏️ Manual
              </button>
            </div>
          </div>

          <!-- Participantes -->
          <div class="space-y-2">
            <span class="text-xs font-bold text-ash">Quem divide essa conta:</span>
            <SeletorMembros 
              :membros="props.membros"
              v-model="participantes"
              :multiple="true"
              @update:model-value="modo === 'MANUAL' ? recalcularSugestaoManual() : null"
            />
          </div>

          <!-- Valores Detalhados -->
          <div v-if="participantes.length > 0" class="pt-3 border-t border-stone-surface">
            <!-- Modo IGUAL -->
            <div v-if="modo === 'IGUAL'" class="bg-[#fbfaf9] border border-stone-surface p-4 rounded-cards text-center">
              <span class="text-[10px] text-ash font-bold block mb-1">Cada pessoa paga</span>
              <strong class="text-xl font-bold text-charcoal">R$ {{ valorSugeridoIgual.toFixed(2).replace('.', ',') }}</strong>
            </div>

            <!-- Modo MANUAL -->
            <div v-else class="space-y-3">
              <div v-for="id in participantes" :key="id" class="flex justify-between items-center text-xs">
                <span class="font-bold text-charcoal">{{ props.membros.find(m => m.id === id)?.nome }}</span>
                <div class="flex items-center gap-1.5">
                  <span class="text-ash font-bold">R$</span>
                  <input 
                    type="number"
                    step="0.01"
                    v-model.number="valores[id]"
                    class="w-24 px-2 py-1.5 text-center font-bold text-charcoal rounded-lg border border-stone-surface bg-[#fbfaf9] focus:border-ember outline-none"
                  />
                </div>
              </div>

              <!-- Erro de Soma Manual -->
              <div v-if="erroSoma" class="text-[10px] font-bold text-coral-red leading-normal bg-coral-red/5 border border-coral-red/25 p-2 rounded-cards text-center animate-pulse">
                ⚠️ A soma dos valores (R$ {{ somaManual.toFixed(2).replace('.', ',') }}) deve fechar exatamente R$ {{ (props.gasto.valorTotal.centavos / 100).toFixed(2).replace('.', ',') }}.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="border-t border-stone-surface pt-4 mt-6 flex gap-3">
        <button 
          @click="emit('close')"
          class="flex-1 py-3 border border-stone-surface bg-[#f6f4ef] hover:bg-stone-surface rounded-buttonspill text-xs font-semibold text-charcoal transition-all active:scale-[0.98]"
        >
          Cancelar
        </button>
        <button 
          @click="salvar"
          :disabled="!podeSalvar"
          :class="[
            'flex-1 py-3 rounded-buttonspill text-xs font-semibold text-white transition-all',
            podeSalvar ? 'bg-midnight hover:bg-charcoal-primary shadow-sm' : 'bg-[#e2dfd9] text-smoke cursor-not-allowed shadow-none'
          ]"
        >
          Salvar Rateio
        </button>
      </div>
    </div>
  </div>
</template>
```

---

### Tarefa 6: Validação Final e Execução de Testes

**Arquivos:**
- Nenhum

- [ ] **Passo 1: Executar todos os testes**

Execute a suíte de testes com vitest:
Run: `npx vitest run`
Expected: PASS para os 120 testes em 30 arquivos de teste.

- [ ] **Passo 2: Compilar o projeto sem erros de TypeScript**

Execute o TypeScript compiler check:
Run: `npx vue-tsc --noEmit`
Expected: Conclusão sem erros.
