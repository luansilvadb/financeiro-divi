# Adicionar Saldo Acumulado nos Detalhes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Atualizar a tabela de extrato no Dashboard de Saldos para exibir tanto o impacto individual de cada lançamento quanto o saldo acumulado resultante.

**Architecture:** Modificação direta no template Vue para refletir os dados já calculados no `getMemberDetails`.

**Tech Stack:** Vue 3, TailwindCSS, Lucide Vue Next.

---

### Task 1: Atualizar Cabeçalho da Tabela

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Renomear "Saldo" e adicionar "Acumulado"**

Localizar o `<thead>` da tabela de drilldown e realizar as alterações de estilo e texto.

```html
<th class="py-2 font-bold text-right">Lançamento</th>
<th class="py-2 font-bold text-right bg-blue-50/50 text-blue-600 rounded-t-lg px-2">Acumulado</th>
```

- [ ] **Step 2: Verificar o alinhamento**

Garantir que as novas colunas mantêm o alinhamento à direita e os pesos de fonte corretos.

---

### Task 2: Atualizar Corpo da Tabela

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Adicionar coluna de Saldo Acumulado no loop `v-for`**

No `<tbody>`, atualizar a exibição do saldo individual (agora chamado Lançamento) e adicionar a célula para o saldo acumulado.

```html
<td :class="['py-2 text-right font-bold', m.net.isZero() ? 'text-gray-400' : (m.net.isPositivo() ? 'text-green-600' : 'text-red-600')]">
  {{ m.net.isPositivo() ? '+' : '' }}{{ formatarDinheiro(m.net) }}
</td>
<td :class="['py-2 text-right font-bold bg-blue-50/30 px-2', m.acumulado.isZero() ? 'text-gray-400' : (m.acumulado.isPositivo() ? 'text-green-600' : 'text-red-600')]">
  {{ m.acumulado.isPositivo() ? '+' : '' }}{{ formatarDinheiro(m.acumulado) }}
</td>
```

- [ ] **Step 2: Validar o uso do campo `m.acumulado`**

Confirmar se `m.acumulado` está sendo acessado corretamente dentro do loop.

---

### Task 3: Finalização e Verificação

**Files:**
- Modify: `src/components/ledger/DashboardSaldos.vue`

- [ ] **Step 1: Executar lint/build (se disponível)**

Verificar se não há erros de sintaxe no template.

Run: `npm run build` (ou similar)

- [ ] **Step 2: Commit das alterações**

```bash
git add src/components/ledger/DashboardSaldos.vue
git commit -m "style: adicionar colunas Lançamento e Acumulado na tabela de extrato"
```
