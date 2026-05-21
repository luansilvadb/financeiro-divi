# Design de Refatoração e Limpeza — MVVM Estrito (DIVI)

Este documento detalha a estratégia para a limpeza profunda e o reforço da arquitetura MVVM no projeto DIVI, eliminando redundâncias e garantindo que cada camada cumpra estritamente seu papel.

## 1. Objetivos de Limpeza (Eliminação de Código Morto)

Identificamos componentes que foram projetados para funcionalidades futuras ou que se tornaram obsoletos:

*   **Remoção de `Antecipacao`:** Esta entidade e seus respectivos serviços/repositórios não estão sendo utilizados ativamente nos fluxos principais de fechamento de fatura ou acerto.
    *   Arquivos a excluir:
        *   `src/models/entities/Antecipacao.ts` e `.test.ts`
        *   `src/models/repositories/IAntecipacaoRepository.ts`
        *   `src/models/repositories/local/LocalStorageAntecipacaoRepository.ts`
    *   Impactos: Remover injeção de `antecipacaoRepository` no `container.ts` e `FaturaService`.

*   **Remoção de `IAntecipacaoRepository`:** O contrato será removido por desuso.

## 2. Reforço da Arquitetura MVVM

Garantiremos a separação absoluta de responsabilidades:

*   **View (Passiva):** Remover lógicas de manipulação de DOM ou decisões de estado complexas de dentro dos arquivos `.vue`.
    *   Exemplo: A lógica de scroll para o item selecionado em `DashboardSaldos.vue` será encapsulada ou simplificada para não interferir na reatividade pura.
*   **ViewModel (Orquestradora):** Reduzir a complexidade do `useDashboardViewModel`.
    *   Extrair funções puras de formatação de datas e meses para `src/shared/utils/meses.ts`.
    *   Mover lógicas de cálculo de saldos complexas para o `NettingService` ou criar um `SaldosService`.
*   **Model (Domínio):** Garantir que os serviços de domínio (`FaturaService`, `GastoService`) não saibam da existência do Vue ou de estados de UI.

## 3. Redução de Complexidade Ciclomática

Foco especial em `useDashboardViewModel.ts`:
*   Atualmente, o arquivo acumula muitos `computed` e métodos de UI.
*   **Ação:** Quebrar em sub-composables menores ou mover lógica de negócio para a camada de Service.
*   **Meta:** Nenhuma função com mais de 20 linhas e complexidade inferior a 5.

## 4. Estratégia de Execução

1.  **Fase 1: Remoção de Código Morto.** Eliminar `Antecipacao` e limpar o `container.ts`.
2.  **Fase 2: Refatoração de ViewModel.** Desacoplar lógicas de cálculo e formatação do `useDashboardViewModel`.
3.  **Fase 3: Limpeza Estética e de Linter.** Remover imports não utilizados e variáveis órfãs em toda a codebase.
4.  **Fase 4: Validação.** Garantir que os 140 testes continuem passando e realizar build de produção.

## 5. Critérios de Sucesso

*   Nenhum arquivo orfão de `Antecipacao` remanescente.
*   `useDashboardViewModel` reduzido em pelo menos 30% de linhas de código.
*   Zero vazamentos de repositórios diretamente para as Views.
*   Suíte de testes 100% verde.
