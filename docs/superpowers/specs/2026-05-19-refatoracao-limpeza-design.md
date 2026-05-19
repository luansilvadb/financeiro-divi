# Especificação de Design: Refatoração, Limpeza e Densificação da Codebase Divi

## 1. Objetivos

*   **Redução de complexidade ciclomática**: Simplificar condicionais aninhados e fluxos complexos em funções chave.
*   **Remoção de código morto**: Eliminar imports não utilizados, variáveis órfãs, logs obsoletos e funções legadas não chamadas.
*   **Densificação**: Garantir que as responsabilidades estejam bem distribuídas entre camadas (domínio, serviços, repositórios, composables e componentes).

---

## 2. Escopo de Alterações

### 2.1. Assistente de Lançamentos (`useNovoLancamentoWizard.ts`)

*   **Validações declarativas**:
    *   Mapear regras de avanço de passo de forma declarativa para os fluxos de despesa (`expense`) e empréstimo (`loan`), eliminando branches `if (step === ...)` aninhados.
*   **Busca e Resolução de Fatura Ativa**:
    *   Criar função utilitária `obterPeriodoCorrente` baseada no `localStorage`.
    *   Criar função pura `determinarCartaoId` isolando a lógica de determinação baseada no método de pagamento, dono do cartão e comprador.
    *   Substituir a lógica duplicada de obter/criar fatura reativa em `findActiveFatura` e `obterOuCriarFaturaParaPeriodo` por um método único centralizado: `obterOuCriarFatura(cartaoId, mes, ano, responsavelId)`.
*   **Decomposição de Fluxo de Salvamento**:
    *   Extrair o laço de projeção de parcelas futuras de `finalizarGastoOuEmprestimo` para um helper dedicado `projetarGastosParcelados`.

### 2.2. Estado e Serviços (`useCartoesEFaturas.ts` & `FaturaService.ts`)

*   **Migração Desacoplada**:
    *   Mover a função `desduplicarEMigrarFaturas` de `useCartoesEFaturas.ts` para dentro do `LocalStorageFaturaRepository.ts` (encapsulando a infraestrutura) ou simplificar a rotina para que o composable de estado reativo não acesse diretamente o `localStorage` nem misture responsabilidades.
*   **Assinatura Limpa em `FaturaService`**:
    *   Substituir overload confuso em `fecharFatura(faturaId, responsavelIdOrDate, dataPagamentoBanco)` pela assinatura definitiva e bem tipada:
        `fecharFatura(faturaId: string, responsavelId?: string, dataPagamentoBanco?: Date)`.
    *   Ajustar as chamadas e testes associados em `FaturaService.test.ts` e `useCartoesEFaturas.ts`.

### 2.3. Apresentação (`DashboardSaldos.vue`)

*   **Varredura de Imports e Código Morto**:
    *   Remover imports de ícones Lucide não utilizados e variáveis declaradas sem uso.
    *   Simplificar ou remover handlers/estruturas redundantes.
    *   Garantir a total estabilidade dos eventos disparados para o `App.vue`.

---

## 3. Critérios de Aceitação e Testabilidade

1.  **Execução de Testes**: Todos os 108 testes existentes na suite do Vitest devem passar sem quebras.
2.  **Verificação de Build**: O build de produção (`npm run build` ou `vue-tsc -b`) deve compilar sem erros de tipagem no TypeScript.
3.  **Comportamento da UI**: A navegação e persistência de rascunhos no Wizard de Lançamentos devem continuar funcionando conforme especificado.
