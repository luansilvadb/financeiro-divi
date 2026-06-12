# SPDD Analysis: Refatoração e Limpeza da Codebase Financeira

## Original Business Requirement
Simplificar a complexidade ciclomática na lógica de registro e onboarding de usuários, remover métodos públicos redundantes e código morto da lógica de lançamentos de gastos no backend, e eliminar propriedades obsoletas no ViewModel do dashboard no frontend, promovendo a densificação e a manutenibilidade do sistema Divi sem alterar suas regras de negócio nem o comportamento das APIs existentes.

## Domain Concept Identification

#### Existing Concepts (from codebase)
- **Usuario**: Entidade que representa as credenciais e o perfil do usuário cadastrado no sistema, associado aos seus perfis de membro na casa.
- **Tenant**: Unidade de organização residencial (moradia) que isola logicamente todos os dados financeiros e membros, servindo como a raiz do isolamento de dados (multitenancy).
- **MembroCasa**: Representa o perfil de um usuário dentro de um tenant específico, contendo regras de cargo e permissões internas na moradia.
- **Gasto**: Lançamento financeiro que pode ser do tipo despesa comum, empréstimo (`isLoan`) ou acerto de netting (`isSettlement`).
- **DivisaoGasto**: Divisão proporcional ou direta do valor de um gasto entre os membros de um tenant.
- **ContaFixa**: Lançamentos e configurações de gastos recorrentes da moradia.

#### New Concepts Required
- Nenhum novo conceito é introduzido, dado que o foco do requisito é a refatoração, eliminação de código morto e simplificação da complexidade do módulo atual.

#### Key Business Rules
- **Onboarding e Registro Multitenant**: No fluxo de criação do usuário, a associação ao tenant (via código de convite `inviteCode`) e o vínculo com um perfil de membro órfão pré-existente (se `membroId` for informado e válido) ou a criação de um novo membro devem ocorrer sob uma transação atômica.
- **Transação de Lançamento de Gasto**: O registro de despesas, empréstimos ou acertos deve ser executado de forma transacional e unificada sob o mesmo serviço de persistência de dados.
- **Notificação em Tempo Real**: Qualquer alteração em membros, gastos ou contas fixas deve disparar sinalizações via gateway de websocket para manter o estado dos clientes atualizado.

## Strategic Approach

#### Solution Direction
- **Redução de Complexidade**: Modularizar o fluxo de `AuthService.register` dividindo suas operações de banco de dados e verificações de onboarding em subfunções auxiliares privadas (`associarUsuarioAoTenantTx` e `vincularMembroExistenteTx`) que recebem e utilizam o client de transação do Prisma.
- **Remoção de Código Morto (Backend)**: Eliminar os métodos públicos obsoletos e redundantes de `LancamentoService` (`salvarDespesaComum`, `salvarEmprestimo` e `registrarAcerto`), mantendo as respectivas rotinas internas de transação e redirecionando toda a lógica de gravação e atualização para a API pública única do método `salvarGasto`.
- **Limpeza no Frontend**: Deletar do ViewModel `useDashboardViewModel.ts` a propriedade obsoleta e o método não utilizado `excluirGasto`, visto que todas as operações de estorno são centralizadas via modal de confirmação associado à função `confirmarEstorno`.
- **Validação com Testes**: Atualizar os testes unitários do backend (`lancamento.service.spec.ts`) para focar a cobertura diretamente sobre a API pública remanescente (`salvarGasto`), simulando as diferentes configurações de payloads (despesa comum, empréstimo e acerto).

#### Key Design Decisions
- **Extração de Lógica Transacional de Onboarding**: Delegar condicionais aninhadas de vínculo de membros e tenants do `AuthService` para funções privadas com contexto transacional. Trade-off: Ligeiro aumento do número de métodos privados, mas melhora significativa na legibilidade e diminuição de complexidade ciclomática do método principal `register`. Recomendação: Adotar essa abordagem.
- **Centralização de Lançamento de Gastos**: Remover wrappers obsoletos do `LancamentoService` no backend e forçar o uso de `salvarGasto` parametrizado. Trade-off: Requer que o DTO de entrada esteja corretamente preenchido com as flags correspondentes, porém limpa a API de serviços. Recomendação: Prosseguir com a centralização.

#### Alternatives Considered
- **Criar um OnboardingService separado**: Rejeitado, pois introduziria camadas adicionais de complexidade no projeto que não trariam benefícios práticos imediatos dado o escopo atual, mantendo as subfunções privadas de onboarding dentro do próprio `AuthService`.

## Risk & Gap Analysis

#### Requirement Ambiguities
- **Comportamento com inviteCode Inválido**: Não está explícito se o registro deve falhar totalmente ou continuar sem vincular um tenant caso o `inviteCode` seja inválido. Pelo comportamento do código original, o sistema falha silenciosamente a associação retornando `tenantId: null` e prossegue com a criação do usuário, o que será preservado.

#### Edge Cases
- **Vínculo com membroId Inexistente**: Caso o onboarding envie um `membroId` que não existe no banco sob o tenant associado ao `inviteCode`. O método `vincularMembroExistenteTx` deve retornar `null` de forma segura e o fluxo deve criar um novo membro no tenant para evitar falhas inesperadas no onboarding.
- **Payloads de Gasto Mistos**: Cenários em que o payload venha com as flags de empréstimo (`isLoan`) e acerto (`isSettlement`) marcadas simultaneamente. O comportamento padrão do switch no service dará precedência à liquidação, mas isso deve ser mitigado ou evitado nas camadas de validação (DTO).

#### Technical Risks
- **Incompatibilidade de Assinaturas nos Testes**: A exclusão dos wrappers públicos obsoletos quebrará testes unitários que testam essas funções individualmente. Mitigado pela reestruturação das suítes de testes em `lancamento.service.spec.ts` para testar `salvarGasto`.
- **Quebras no Compilador (Frontend e Backend)**: Riscos de importações e chamadas remanescentes a métodos deletados. Mitigado executando builds de verificação gerais do projeto após as alterações.

#### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | Simplificar a complexidade ciclomática do onboarding de usuários no AuthService | Sim | Implementado dividindo condicionais transacionais em subfunções privadas. |
| 2 | Remover métodos redundantes e código morto no LancamentoService | Sim | Métodos públicos obsoletos foram retirados da API interna. |
| 3 | Atualizar os testes unitários do LancamentoService no Jest | Sim | Testes adaptados para direcionar asserções sobre `salvarGasto`. |
| 4 | Deletar propriedade e método obsoleto `excluirGasto` no useDashboardViewModel do Vue | Sim | Método removido sem afetar os templates ou views existentes. |
| 5 | Garantir integridade de build e de testes após as modificações | Sim | Validado por compilação TypeScript local e execução dos runners de teste. |
