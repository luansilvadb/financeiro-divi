## Context

O sistema atual centraliza a complexidade de entrada de dados no `NovoLancamentoWizard.vue` (frontend) e no `LancamentoService.ts` (backend). Essa centralização obscurece as diferenças fundamentais entre uma despesa compartilhada, um empréstimo pessoal e um acerto de netting. A ausculta revelou que essa "névoa" de condicionais dificulta a evolução de cada fluxo de forma independente.

## Goals / Non-Goals

**Goals:**
- **Atomização UI**: Decompor o wizard em componentes menores e testáveis.
- **Segregação de Domínio**: Especializar os fluxos de despesa, empréstimo e acerto no backend.
- **Simplificação de Fluxo**: Reduzir a redundância na inicialização do app.
- **Limpeza de Delegação**: Permitir que os serviços de domínio falem diretamente com os controllers.

**Non-Goals:**
- Alterar o esquema do banco de dados (Prisma) neste momento, para evitar migrações complexas.
- Refatorar o `NettingService` (apenas como ele é invocado/registrado).

## Decisions

### 1. Componentização do Wizard (Frontend)
- **Decisão**: Criar o diretório `src/views/components/wizard/` e extrair cada passo para um componente funcional.
- **Racional**: O wizard atual é difícil de ler e testar. Componentes menores permitem validações isoladas e melhor manutenção visual.
- **Alternativa**: Usar uma biblioteca de formulários complexa. Descartado para manter a leveza e o controle total sobre a animação "spring".

### 2. Segregação de Responsabilidade no LancamentoService (Backend)
- **Decisão**: Dividir o método `salvarGasto` em `salvarDespesaComum`, `salvarEmprestimo` e `registrarAcerto`.
- **Racional**: Embora o destino final seja a tabela `Gasto`, as regras de validação e os efeitos colaterais (como criação de faturas futuras) variam drasticamente entre os fluxos.
- **Alternativa**: Continuar usando um DTO único com campos opcionais. Descartado por ser propenso a erros de validação cruzada.

### 3. Injeção Direta no Controller (Backend)
- **Decisão**: Injetar `MembroService`, `CartaoService` e `LancamentoService` diretamente no `FinanceiroController`.
- **Racional**: O `FinanceiroService` atual atua como um "Proxy Monolítico" sem valor agregado, apenas delegando chamadas. Removê-lo reduz a profundidade da pilha de chamadas e a entropia.

### 4. Unificação da Inicialização (Frontend)
- **Decisão**: Centralizar a inicialização de dados em um único método `assegurarDadosIniciais` no `App.vue`, invocado de forma idempotente.
- **Racional**: Atualmente, `onMounted` e handlers de sucesso fazem chamadas redundantes que podem causar race conditions ou flicker na UI.

## Risks / Trade-offs

- **[Risco]** Perda de reatividade no estado do Wizard ao mover para componentes filhos → **[Mitigação]** Usar o padrão de `v-model` ou passar o estado como props reativas e emitir eventos de atualização.
- **[Risco]** Quebra de endpoints existentes no backend ao remover o `FinanceiroService` → **[Mitigação]** Manter o `FinanceiroController` com a mesma interface pública, apenas mudando as injeções internas.
