# Especificação de Design: Refatoração e Limpeza da Base de Código

Este documento detalha o planejamento para limpeza de código morto, resolução de erros do compilador TypeScript e redução de complexidade ciclomática em componentes críticos, mantendo a integridade dos dados e do comportamento financeiro da aplicação Divi.

## 1. Objetivos

1. **Remoção de Código Morto:** Excluir imports e variáveis declaradas mas não utilizadas em arquivos como `App.vue`, `BottomSheetAjustarGasto.vue`, `ConfiguracoesMembros.vue`, `BottomSheetAcertoCompensacao.vue` e `DashboardSaldos.vue`.
2. **Resolução de Erros do Compilador:** Corrigir os erros do build do TypeScript causados pelas declarações não lidas e pela falta de acesso a propriedades internas no arquivo de testes `BottomSheetAcertoCompensacao.test.ts`.
3. **Redução de Complexidade Ciclomática:** Simplificar métodos estruturalmente complexos e condicionais aninhados no componente central `DashboardSaldos.vue` (especialmente `obterPeriodoInicial`, `listaMesesSeletor` e `faturaAtivaVisualizada`).
4. **Verificação de Regressão:** Garantir que a suíte de testes de 130 testes unitários e de integração continue passando e o build seja bem-sucedido.

## 2. Detalhes Técnicos das Alterações

### A. Correção de Imports e Declarações Não Utilizadas

*   **`src/App.vue`:**
    *   Remover `import Button from './components/ui/Button.vue'`.
*   **`src/components/ledger/BottomSheetAjustarGasto.vue`:**
    *   Remover `import SectionLabel from '../ui/SectionLabel.vue'`.
*   **`src/components/ledger/ConfiguracoesMembros.vue`:**
    *   Remover `UserPlus` da desestruturação do import de `lucide-vue-next`.
*   **`src/components/ledger/dashboard/BottomSheetAcertoCompensacao.vue`:**
    *   Remover `import SectionLabel from '../../ui/SectionLabel.vue'`.
    *   Adicionar `defineExpose({ valorReal })` ao final do bloco de script para expor a referência ao valor real nos testes unitários.
*   **`src/components/ledger/dashboard/BottomSheetAcertoCompensacao.test.ts`:**
    *   Remover `vi` de `import { describe, it, expect, vi } from 'vitest'`.
    *   Utilizar um cast explícito (`any` ou uma interface adequada) para acessar `valorReal` na instância do wrapper do Vue Test Utils:
        ```typescript
        expect((wrapper.vm as any).valorReal).toBe(150.50)
        ```
*   **`src/components/ledger/DashboardSaldos.vue`:**
    *   Remover desestruturação não utilizada de `sugerirProximoPeriodo` da chamada para `calculations`.
    *   Remover a constante wrapper `getCartaoNome` não lida.
    *   Remover a constante de desestruturação não lida `const { isMonthLocked } = useFaturaRollover()`.

### B. Simplificação Estrutural de `DashboardSaldos.vue`

1.  **Simplificação de `obterPeriodoInicial`:**
    Substituir condicionais encadeados por uma abordagem de fallbacks lineares mais limpa e legível:
    ```typescript
    const obterPeriodoInicial = () => {
      const salvo = localStorage.getItem('divi_periodo_selecionado')
      if (salvo) {
        try {
          const parsed = JSON.parse(salvo)
          if (parsed.mes && parsed.ano) return parsed
        } catch (e) {}
      }
      const faturaReferencia = props.faturasAbertas?.[0] || props.faturasFechadas?.[0]
      if (faturaReferencia?.periodo) {
        return { mes: faturaReferencia.periodo.mes, ano: faturaReferencia.periodo.ano }
      }
      return { mes: new Date().getMonth() + 1, ano: new Date().getFullYear() }
    }
    ```

2.  **Simplificação de `listaMesesSeletor`:**
    A aritmética de meses pode ser expressa de forma linear usando o objeto `Date` nativo em vez de condicionais `while` e manipulações manuais de variáveis auxiliares:
    ```typescript
    const listaMesesSeletor = computed(() => {
      const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
      const hoje = new Date()
      const list = []

      // Gera os meses no intervalo de -24 a +24 em relação ao mês atual
      for (let i = -24; i <= 24; i++) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
        const mesIdx = d.getMonth() + 1
        const anoIdx = d.getFullYear()
        
        const estaFechada = props.faturasFechadas.some(
          f => f.periodo.mes === mesIdx && f.periodo.ano === anoIdx
        )

        list.push({
          mes: mesIdx,
          ano: anoIdx,
          nome: `${meses[mesIdx - 1]} ${anoIdx}`,
          status: estaFechada ? 'FECHADA' : 'ABERTA'
        })
      }

      return list
    })
    ```

3.  **Simplificação de `faturaAtivaVisualizada`:**
    Expressar a busca utilizando métodos declarativos (`.find` / fallback simplificado):
    ```typescript
    const faturaAtivaVisualizada = computed(() => {
      const p = periodoSelecionado.value
      const faturaEncontrada = props.faturasAbertas.find(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano) ||
                               props.faturasFechadas.find(f => f.periodo.mes === p.mes && f.periodo.ano === p.ano)
      if (faturaEncontrada) return faturaEncontrada

      return new Fatura({
        id: `virtual-${p.mes}-${p.ano}`,
        cartaoId: props.cartoes[0]?.id || 'virtual-card',
        periodo: { mes: p.mes, ano: p.ano },
        responsavelId: props.membros[0]?.id || 'virtual-member',
        status: 'ABERTA'
      })
    })
    ```

## 3. Critérios de Aceitação e Sucesso

1. O comando `npm run build` deve compilar com sucesso sem nenhuma falha ou aviso de tipo.
2. O comando `npx vitest run` deve passar com 100% de sucesso in todos os 130 testes existentes.
3. Nenhuma alteração no formato de persistência local deve ocorrer.
