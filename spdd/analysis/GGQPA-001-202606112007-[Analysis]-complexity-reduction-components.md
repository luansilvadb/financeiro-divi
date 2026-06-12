# SPDD Analysis: Redução de Complexidade Ciclomática dos Componentes

## Original Business Requirement
1. **Redução de complexidade ciclomática dos componentes** — Simplifique funções com muitos branches, condicionais aninhados e caminhos de execução desnecessários, quebrando-os em unidades menores e coesas.

## Domain Concept Identification

#### Existing Concepts (from codebase)
- **Usuario**: Representa as credenciais, dados básicos e perfis de associação do usuário cadastrado na aplicação.
- **Tenant**: Representa o grupo ou unidade familiar (moradia) que isola logicamente todas as despesas, cartões de crédito e membros (isolation level da arquitetura multi-tenant).
- **MembroCasa**: Representa o vínculo de um usuário a um tenant específico, definindo dados como nome exibido, avatar e o cargo. Pode ser criado do zero no onboarding ou associado a um registro pré-existente (membro órfão).

#### New Concepts Required
- Nenhum novo conceito de domínio de negócio é necessário, visto que a tarefa de redução de complexidade visa reestruturar e modularizar fluxos de lógica interna (refatoração estrutural).

#### Key Business Rules
- **Atomicidade no Onboarding**: A criação do usuário e a associação deste a um tenant e perfil de membro correspondente devem ocorrer de forma transacional e atômica. Se um passo falhar, todo o registro deve ser revertido.
- **Associação por Convite**: O registro em uma moradia existente requer a passagem de um `inviteCode` válido.
- **Vínculo de Membro Órfão**: Se o onboarding for iniciado a partir de um convite a um morador específico (identificado por `membroId`), o registro deve atualizar a propriedade `userId` desse membro preexistente em vez de criar um novo registro em `MembroCasa`.

## Strategic Approach

#### Solution Direction
- **Modularização de Lógica Transacional**: Simplificar o método `AuthService.register` dividindo o bloco transacional em métodos privados focados e coesos.
- **Passagem Explícita de Transação**: Passar o cliente de transação do Prisma (`tx: Prisma.TransactionClient`) como parâmetro para as funções auxiliares para que todas as escritas e leituras ocorram sob o mesmo contexto atômico.
- **Redução de Aninhamento**: Eliminar estruturas profundas de decisão condicional (IFS aninhados) simplificando a assinatura e o fluxo de controle de `register`.

#### Key Design Decisions
- **Extração para Funções Auxiliares Privadas em `AuthService`**: Criar as funções auxiliares `associarUsuarioAoTenantTx` e `vincularMembroExistenteTx`.
  - *Trade-off*: Aumenta levemente a quantidade de métodos da classe, porém reduz de forma substancial a complexidade ciclomática do método público principal e facilita a leitura e manutenção individual do fluxo de convites e vinculações.
  - *Recomendação*: Prosseguir com a modularização interna, pois mantém a coesão no mesmo serviço sem a necessidade de criar um novo serviço de onboarding complexo.

#### Alternatives Considered
- **Criar um OnboardingService dedicado**: Rejeitado para esta etapa, já que o fluxo de onboarding se integra fortemente com o registro de credenciais de usuário. Introduzir uma nova camada de serviço agora geraria complexidade desnecessária para a estrutura atual da aplicação.

## Risk & Gap Analysis

#### Requirement Ambiguities
- **Comportamento com inviteCode Inexistente**: Caso o usuário forneça um código de convite que não é encontrado na base, o comportamento original de criar o usuário sem tenant (órfão) foi mantido. Em um cenário ideal de negócio, o sistema deveria avisar explicitamente sobre o código inválido antes de concluir o registro, mas para evitar regressões e quebras de fluxo, manteve-se o fluxo de retorno nulo existente.

#### Edge Cases
- **Consistência de Dados no Vínculo de Membro Existente**: Se o `membroId` fornecido não pertencer ao tenant localizado pelo `inviteCode`. O método `vincularMembroExistenteTx` mitiga isso validando o par `(id, tenantId)` na cláusula `where`, prevenindo que usuários se vinculem a perfis de moradores de outras residências.
- **Payload com membroId 'novo' ou nulo**: Lidar corretamente com a flag de criação de novo membro sem lançar exceções de nulo ou tentar atualizar registros inexistentes.

#### Technical Risks
- **Perda de Contexto Transacional**: Risco de usar `this.prisma` acidentalmente dentro dos métodos privados extraídos, o que causaria violação de integridade da transação ou deadlock nas operações concorrentes de cadastro.
  - *Mitigação*: Assinatura estrita exigindo `tx: Prisma.TransactionClient` e revisão cuidadosa das chamadas internas para garantir que usem a instância `tx`.

#### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | Simplificar branches e caminhos no fluxo de registro | Sim | Dividido em subfunções transacionais auxiliares. |
| 2 | Reduzir o aninhamento profundo (complexidade ciclomática) em AuthService | Sim | Complexidade do método principal reduzida significativamente. |
| 3 | Garantir segurança de concorrência e atomicidade no cadastro | Sim | Preservada via Prisma `$transaction`. |
