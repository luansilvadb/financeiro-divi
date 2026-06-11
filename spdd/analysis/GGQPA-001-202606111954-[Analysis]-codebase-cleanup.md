# SPDD Analysis: Refatoração e Limpeza da Codebase

## Original Business Requirement
Refatore e limpe a codebase, com foco em:

1. **Redução de complexidade ciclomática** — Simplifique funções com muitos branches, condicionais aninhados e caminhos de execução desnecessários, quebrando-os em unidades menores e coesas.
2. **Remoção de código morto** — Elimine variáveis não utilizadas, funções órfãs, imports desnecessários, comentários obsoletos e qualquer artefato que não agregue valor real ao sistema.
3. **Densificação do projeto** — Garanta que cada arquivo, função e módulo que permanecer na codebase tenha responsabilidade clara e justificada. Se não tem propósito ativo, remove.

**Critério de decisão:** Ao avaliar cada trecho, aplique o princípio: *"esse código está sendo usado e faz algo necessário agora?"* — se a resposta for não, elimine.

## Domain Concept Identification

#### Existing Concepts (from codebase)
- **Usuario**: Entidade de login e perfil, associada a múltiplos Tenants e responsável por possuir credenciais.
- **Tenant**: Unidade lógica de moradia/casa. Define o limite de dados multitenant.
- **MembroCasa**: Representação de um usuário em uma casa ativa, vinculando-o ao Tenant correspondente.
- **Gasto**: Lançamento financeiro que representa despesa comum, empréstimo ou acerto de netting.
- **Fatura**: Registro de período financeiro vinculado a cartões ou fluxo de Pix.
- **Cartao**: Cadastro de cartões de crédito pertencentes a membros da moradia.
- **ContaFixa**: Modelo de despesa recorrente da moradia.

#### New Concepts Required
- Nenhum novo conceito é introduzido, dado que a tarefa foca em refatoração e remoção de código supérfluo.

#### Key Business Rules
- **Registro Multitenant**: Todo novo usuário criado opcionalmente se vincula a um Tenant já existente via `inviteCode` ou vincula a um `MembroCasa` existente que esteja órfão de usuário (`userId = null`).
- **Gasto Unificado**: A gravação de gastos deve suportar dinamicamente despesas comuns, empréstimos ou acertos dentro de uma transação de banco de dados única e segura.

## Strategic Approach

#### Solution Direction
- **Redução de Complexidade**: Modularizar o método `AuthService.register` dividindo suas operações de banco de dados aninhadas em métodos privados menores, facilitando a legibilidade e manutenibilidade sem alterar a lógica funcional.
- **Remoção de Código Morto (Backend)**: Identificar que os métodos públicos `salvarDespesaComum`, `salvarEmprestimo` e `registrarAcerto` de `LancamentoService` são apenas wrappers redundantes do método privado de transação e não são expostos pelos controllers. Eles serão deletados, migrando o único ponto de entrada para o método `salvarGasto`. O arquivo de testes `lancamento.service.spec.ts` será atualizado correspondendo a essa mudança.
- **Remoção de Código Morto (Frontend)**: O método `excluirGasto` do ViewModel `useDashboardViewModel.ts` está obsoleto e redundante com `confirmarEstorno` e não é invocado no frontend, portanto será deletado.

#### Key Design Decisions
- **Refatoração Segura de `AuthService.register`**: Extrair a lógica condicional de vínculo a membros/tenants para funções internas `associarUsuarioAoTenantTx` e `vincularMembroExistenteTx`. Trade-off: Leve aumento na quantidade de métodos, mas significativa redução na indentação aninhada e na complexidade ciclomática do fluxo principal. Recomendação: Executar a extração.
- **Remoção de Wrappers no `LancamentoService`**: Eliminar as funções redundantes e reescrever o arquivo de testes `lancamento.service.spec.ts` para testar os cenários diretamente pela função pública e unificada `salvarGasto`. Trade-off: Alteração dos testes unitários legados. Recomendação: Prosseguir com a limpeza.

#### Alternatives Considered
- **Manter os wrappers de Lançamento no Service**: Rejeitado, pois manter métodos públicos que nunca são usados no código de produção viola a diretriz de densificação do projeto e gera manutenção desnecessária.

## Risk & Gap Analysis

#### Requirement Ambiguities
- Nenhuma ambiguidade crítica de negócio foi encontrada, pois o foco é puramente técnico (refatoração).

#### Edge Cases
- **Vínculos de Onboarding**: Ao registrar um usuário, a associação de membro não deve quebrar caso o `inviteCode` ou `membroId` venham em formatos inesperados ou nulos. As subfunções devem garantir a resiliência original.
- **Integridade Transacional de Lançamentos**: A transação do Prisma de gastos múltiplos (`salvarMuitosGastos`) deve continuar executando as transações privadas de despesa, empréstimo e acerto atomicamente.

#### Technical Risks
- **Quebra de Testes Unitários**: Remover métodos obsoletos quebrará os testes do Jest no backend. Mitigado atualizando `lancamento.service.spec.ts` para testar o método unificado `salvarGasto`.
- **Compilação e Lints**: Qualquer importação esquecida ou tipo inadequado após a remoção de código quebra o build do TypeScript. Mitigado rodando builds de verificação locais após os ajustes.

#### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | Simplificar `AuthService.register` extraindo condicionais | Sim | Realizado por métodos auxiliares privados. |
| 2 | Deletar wrappers obsoletos de `LancamentoService` | Sim | Remover `salvarDespesaComum`, `salvarEmprestimo` e `registrarAcerto`. |
| 3 | Atualizar os testes unitários do `LancamentoService` | Sim | Ajustar os testes para cobrirem o comportamento através de `salvarGasto`. |
| 4 | Deletar método morto `excluirGasto` do `useDashboardViewModel.ts` | Sim | Remover a propriedade e sua implementação no ViewModel. |
| 5 | Garantir integridade de compilação e execução | Sim | Validar via scripts de build do pnpm. |
