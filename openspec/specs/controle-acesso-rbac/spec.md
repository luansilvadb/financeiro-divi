# controle-acesso-rbac Specification

## Purpose
O sistema deve implementar Controle de Acesso Baseado em Cargos (RBAC) para garantir a segurança e integridade dos dados da casa, permitindo diferentes níveis de permissão para administradores, moradores e visualizadores.

## Requirements
### Requirement: Atribuição de Cargos (RBAC)
O sistema DEVE permitir a definição de papéis de acesso (ADMIN, MORADOR, VISUALIZADOR) para cada morador da casa, determinando quais ações ele pode executar no sistema de forma transparente. A lógica de atribuição DEVE ser centralizada em um `CargoService` no backend.

#### Scenario: Atribuir cargo de Administrador a outro membro
- **WHEN** um usuário logado com o papel de ADMIN altera o cargo de outro morador para Administrador no Bottom Sheet e clica em "Salvar Alterações"
- **THEN** o sistema atualiza o cargo do morador para ADMIN no banco de dados através do `CargoService` e propaga a alteração no frontend em tempo real via WebSocket

#### Scenario: Impedir que não-administrador altere cargos
- **WHEN** um usuário com papel de MORADOR ou VISUALIZADOR tenta fazer uma requisição para alterar cargos de membros
- **THEN** o sistema rejeita a operação com erro HTTP 403 (Forbidden) validado pelo `TenantRoleGuard`

#### Scenario: Impedir que o último administrador remova seu próprio cargo
- **WHEN** o único administrador ativo da casa tenta alterar seu próprio cargo para MORADOR ou VISUALIZADOR, ou tenta desativar a si mesmo no Bottom Sheet
- **THEN** o sistema bloqueia a alteração no frontend e backend através de regras de negócio no `MembroService`, exibindo uma mensagem de erro apropriada

### Requirement: Restrições de Ações no Sistema por Cargo
O sistema DEVE aplicar de forma rígida as permissões de acesso no backend para restringir operações de acordo com o papel do membro logado na casa.

#### Scenario: Morador tenta excluir gasto de outro membro
- **WHEN** um usuário com papel de MORADOR tenta excluir uma despesa cujo comprador ou responsável seja outro membro da casa
- **THEN** o sistema rejeita a exclusão no backend retornando HTTP 403 (Forbidden)

#### Scenario: Visualizador tenta registrar despesa
- **WHEN** um usuário com papel de VISUALIZADOR tenta registrar uma nova despesa ou conta fixa na casa
- **THEN** o sistema bloqueia a ação na interface do usuário (desabilitando botões) e rejeita a requisição de criação no backend com HTTP 403 (Forbidden)
