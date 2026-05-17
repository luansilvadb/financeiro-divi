# Especificação: Remodelação do Fluxo de Cartão de Crédito v2

**Data:** 2026-05-17  
**Status:** Aprovado  
**Versão:** 2.0.0  

---

## 1. Contexto e Motivação

O sistema já possui as entidades de domínio corretas (`Cartao`, `Fatura`, `Gasto`, `Antecipacao`, `AcertoMembro`) e o ciclo de vida `ABERTA → FECHADA → ACERTADA`. O que falta é a **camada de experiência** que conecta esses conceitos ao comportamento real de uma casa compartilhada.

Seis gaps foram identificados e aprovados:

| Gap | Área | Impacto |
|-----|------|---------|
| 1 | Linguagem da UI | "Adiantamento" é jargão técnico — confunde usuários |
| 2 | Tela de Revisão | Não existe tela entre fechar e confirmar acertos |
| 3 | Wizard de lançamento | Divisão só no fechamento — artificial para compras óbvias |
| 4 | Casa com 3+ membros | UI de acertos não escala claramente |
| 5 | Histórico | Faturas `ACERTADA` somem do dashboard |
| 6 | Responsável variável | Dono da fatura sempre herda do cartão, sem override |

---

## 2. O que NÃO muda

O domínio está correto e não será alterado:

- Entidades: `Cartao`, `Fatura`, `Gasto`, `Antecipacao`, `AcertoMembro` — intactas
- Cálculo `RESPONSAVEL_PAGA` / `MEMBRO_PAGA` em `AcertoMembro.ts` — correto
- Ciclo de vida `ABERTA → FECHADA → ACERTADA` — mantido
- Serviços `FaturaService` e `AcertoService` — sem mudanças de lógica

---

## 3. Gap 1 — Renomear "Adiantamento" na UI

### Problema
O wizard usa o termo "Registrar Adiantamento" para o fluxo em que um membro paga uma conta da casa antes do fechamento (ex: Maria paga o aluguel em dinheiro). "Adiantamento" é jargão técnico que não representa o que o usuário está fazendo.

### Solução
Apenas mudanças de texto na UI — sem alteração de domínio:

| Antes | Depois |
|-------|--------|
| "Registrar Adiantamento" | "Registrar Pagamento Antecipado" |
| "Registrar transferência de dinheiro para o dono do cartão" | "Paguei uma conta da casa antes do fechamento" |
| "Qual o valor do adiantamento?" | "Qual o valor que você pagou?" |
| "Valor Adiantado (Pix)" | "Valor Pago" |

**Arquivo:** `NovoLancamentoWizard.vue` — somente strings de label, sem lógica.

---

## 4. Gap 2 — Tela de Revisão da Fatura

### Problema
`FaturaService` já tem `fecharFatura()` e `confirmarAcertos()` separados. Mas a UI não tem uma tela que permita ao usuário ajustar gastos entre os dois momentos.

### Fluxo
```
Fatura ABERTA
  → [Fechar Fatura] → confirma quem pagou ao banco (ver Gap 6)
  → Fatura FECHADA (modo: Revisão)
  → [Tela de Revisão] → usuário ajusta gastos
  → [Confirmar Acertos] → gera AcertoMembro, bloqueia edições
  → Fatura em modo: Em Acerto
  → [Membros pagam] → ACERTADA
```

### Componente: `RevisaoFatura.vue` (novo)

**Seção 1 — Lista de gastos:**
- Cada linha: ícone de categoria, descrição, data, valor, avatar do comprador
- Botão **✂️ Dividir**: abre modal com opção de divisão igual, por valor ou por %. Ao confirmar, salva as `DivisaoDeGasto` no `GastoRepository`
- Botão **↩ Trocar**: dropdown inline com avatares dos membros para alterar o `compradorId` do gasto

**Seção 2 — Prévia de acertos (tempo real):**
- Recalcula a cada modificação na lista
- Um card por membro com saldo resultante
- Verde com `+` = vai receber (tipo `RESPONSAVEL_PAGA`)
- Vermelho com `−` = vai pagar (tipo `MEMBRO_PAGA`)
- Direção explícita: "João deve R$ 560 para Maria"

**Seção 3 — Ação:**
- Botão **"Confirmar Acertos →"** chama `FaturaService.confirmarAcertos(faturaId)`
- Texto informativo: "Após confirmar, os gastos ficam bloqueados para edição"

**Estado de cálculo da prévia:**
A prévia usa a mesma lógica do `FaturaService.confirmarAcertos()` mas de forma não-persistida (read-only, calculada em memória no composable).

---

## 5. Gap 3 — Divisão Opcional no Wizard

### Problema
Toda compra fica 100% do comprador até o fechamento. Para compras com divisão óbvia (ex: supermercado), forçar esperar o fechamento é artificial.

### Solução
Adicionar **passo 5 opcional** ao fluxo de GASTO no `NovoLancamentoWizard.vue`:

```
Passo 1: O que quer fazer?
Passo 2: Escolha o cartão
Passo 3: Quem passou o cartão?
Passo 4: Valor e descrição
Passo 5 (NOVO): Quer dividir essa compra agora? [Sim / Não, depois]
```

**Comportamento do Passo 5:**
- **"Não, depois"** (padrão): avança direto para finalizar. Gasto criado 100% no comprador. Zero fricção para o caso mais comum.
- **"Sim, dividir"**: exibe grid de avatares (multi-seleção). Ao selecionar membros, o usuário pode escolher **Igual** (divide automaticamente) ou **Manual** (digita o valor de cada um). Validação: soma das partes deve igualar o total.

**Impacto no domínio:** `Gasto` aceita `divisoes` com múltiplos membros — já suportado. O `compradorId` continua sendo quem passou o cartão (independente de como a despesa foi dividida).

---

## 6. Gap 4 — Casa com 3+ Membros

### Problema
A tela de revisão e o painel de acertos foram projetados com 2 membros em mente. Com 3+, a leitura dos saldos fica confusa.

### Solução
A tela de revisão (`RevisaoFatura.vue`) e o painel de acertos no `DashboardSaldos.vue` devem renderizar **um card por membro**, iterando sobre todos os `AcertoMembro` da fatura.

**Regras de exibição para N membros:**
- Membros com `tipo: MEMBRO_PAGA`: card vermelho, seta `→ [membro] paga [valor] para [responsável]`
- Membros com `tipo: RESPONSAVEL_PAGA`: card verde, seta `← [responsável] deve [valor] para [membro]`
- Responsável da fatura: não aparece na lista de acertos (já excluído pelo `FaturaService`)
- Membros com `valorAcerto === 0`: omitidos (consumo igual ao adiantado — caso de empate exato)

**Nenhuma mudança de domínio** — o `FaturaService.confirmarAcertos()` já itera sobre todos os membros.

---

## 7. Gap 5 — Histórico de Faturas

### Problema
Faturas `ACERTADA` desaparecem do dashboard. Não há como auditar o passado.

### Solução
Nova seção colapsável **"Histórico"** no `DashboardSaldos.vue`, abaixo das faturas ativas:

**Listagem:**
- Faturas com status `ACERTADA`, ordenadas por período (mais recente primeiro)
- Cada item: nome do cartão, período (ex: "Maio/2026"), valor total, data do acerto

**Detalhe (expansível ou modal):**
- Lista de gastos da fatura (somente leitura)
- Lista de acertos realizados com valor e data de pagamento

**Implementação:** Novo método `buscarPorStatus('ACERTADA')` no `IFaturaRepository` e adapter correspondente. Sem novas entidades.

---

## 8. Gap 6 — Responsável da Fatura Pode Variar

### Problema
O `responsavelId` da `Fatura` é sempre herdado do `responsavelPadraoId` do `Cartao`. Não há como sobrescrever para um mês específico (ex: João viajou e Maria pagou a fatura ao banco).

### Solução
Ao acionar **"Fechar Fatura"**, exibir um modal de confirmação:

```
"Quem pagou a fatura ao banco este mês?"
[grid de avatares dos membros da casa]
[padrão pré-selecionado: responsavelPadraoId do Cartao]
[Botão: Confirmar Fechamento]
```

O avatar selecionado é passado como `responsavelId` ao `FaturaService.fecharFatura(faturaId, responsavelId, dataPagamento?)`.

**Mudança no `FaturaService.fecharFatura()`:**
```typescript
// Antes:
async fecharFatura(faturaId: string, dataPagamentoBanco?: Date): Promise<void>

// Depois:
async fecharFatura(faturaId: string, responsavelId: string, dataPagamentoBanco?: Date): Promise<void>
```

**Nota de implementação:** `Fatura.responsavelId` é `readonly` no domínio atual. O override será feito no nível do adapter/repositório: ao salvar a fatura fechada, o `LocalStorageFaturaRepository` persiste o `responsavelId` fornecido pelo serviço. Alternativamente, adicionar `fechar(responsavelId?: string, dataPagamento?: Date)` na entidade `Fatura` como overload opcional, mantendo retrocompatibilidade.

**Retrocompatibilidade:** Faturas já existentes sem override continuam com o `responsavelId` original. Nenhuma migração necessária.

---

## 9. Arquitetura de Componentes (Resumo)

```
DashboardSaldos.vue (existente — expandido)
├── FaturasEmAcerto.vue (existente — adaptar para N membros)
├── FaturasAbertas.vue (existente — sem mudança)
├── RevisaoFatura.vue (NOVO — Gap 2)
│   ├── ListaGastosRevisao.vue (NOVO)
│   ├── ModalDivisaoGasto.vue (NOVO — Gap 3 também usa)
│   └── PreviaAcertos.vue (NOVO — escala para N membros)
└── HistoricoFaturas.vue (NOVO — Gap 5)

NovoLancamentoWizard.vue (existente — modificado)
├── ... passos 1–4 sem mudança ...
├── PassoDivisaoOpcional.vue (NOVO — Gap 3)
└── labels atualizados (Gap 1)

ModalFecharFatura.vue (NOVO — Gap 6)
```

---

## 10. Plano de Verificação

- **Gap 1:** Verificar que todas as strings do fluxo ADIANTAMENTO usam a nova linguagem
- **Gap 2:** `RevisaoFatura.vue` recalcula prévia ao editar comprador ou divisão de qualquer gasto
- **Gap 2:** `confirmarAcertos()` após revisão gera `AcertoMembro` com valores corretos
- **Gap 3:** Passo 5 com "Não, depois" cria gasto 100% no comprador; com "Sim, dividir" a soma das partes valida antes de salvar
- **Gap 4:** Com 3 membros, prévia exibe 3 cards distintos com direções corretas
- **Gap 5:** Fatura ACERTADA aparece no histórico; detalhes mostram gastos e acertos corretamente
- **Gap 6:** `fecharFatura()` com responsavelId diferente do padrão persiste override e o `confirmarAcertos()` exclui o membro correto dos acertos
