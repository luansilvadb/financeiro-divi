## Context

Atualmente, o Divi não possui controle de permissões (RBAC). Qualquer morador adicionado a uma moradia (Tenant) compartilha exatamente os mesmos direitos sobre o saldo, despesas, cartões de crédito e gerenciamento de membros. Para evoluir a segurança e oferecer controle de acesso corporativo e familiar estruturado, implementaremos um RBAC baseado em três cargos: `ADMIN`, `MORADOR` e `VISUALIZADOR`.

Além disso, adaptamos a tela de gerenciamento de moradores com foco total em Mobile-first. Removemos o recurso de convite desta aba e introduzimos uma interface de edição em Bottom Sheet com controles por toque de alta usabilidade (toggles/switches) e informativos sobre cada permissão.

## Goals / Non-Goals

**Goals:**
- Adicionar uma camada de segurança robusta baseada em cargos no backend (NestJS/Prisma) e no frontend (Vue 3).
- Implementar o fluxo de edição de membros por meio de um Bottom Sheet otimizado para celulares.
- Exibir dinamicamente em formato de "Central de Controle" (switches de leitura) as permissões concedidas por cada cargo na tela de edição.
- Proteger rotas e ações críticas (ex: gerenciar membros, fechar faturas) a nível de backend por meio de Guards de validação de cargo.
- Evitar que uma moradia fique sem administradores ativos (impedindo a desativação ou alteração do último admin).

**Non-Goals:**
- Permitir customização granular de permissões por usuário (ABAC). O sistema usará estritamente os três cargos predefinidos.
- Implementar nesta mudança o novo fluxo ou tela dedicada para convites de novos moradores (isso será tratado em uma tarefa/spec separada).

## Decisions

### 1. Modelagem no Banco de Dados (Prisma)
- **Decisão**: Adicionar um tipo `enum Role` no arquivo `schema.prisma` e associar ao modelo `MembroCasa`.
- **Valores do Enum**: `ADMIN`, `MORADOR`, `VISUALIZADOR`.
- **Novo Campo**: `role Role @default(MORADOR)` na tabela `membros_casa`.
- **Raciocínio**: Utilizar enum nativo do Postgres garante a integridade dos dados no banco e no ORM Prisma. O valor padrão de novos moradores será sempre `MORADOR`, exceto para o criador do Tenant (moradia), que é automaticamente definido como `ADMIN`.

### 2. Validação no Backend (NestJS Guards)
- **Decisão**: Criar um decorator `@Roles(Role.ADMIN)` e um guard `TenantRoleGuard` que verifica se o membro correspondente ao usuário autenticado possui o papel adequado para o tenant da requisição.
- **Implementação**:
  - O Guard extrai o `tenantId` da requisição e o `userId` do payload do token JWT.
  - Consulta o registro de `MembroCasa` correspondente a essa dupla.
  - Compara a propriedade `role` encontrada com os cargos permitidos no endpoint. Se não for compatível, lança erro `403 Forbidden`.
- **Raciocínio**: Essa abordagem desacopla a segurança das rotas e serviços, centralizando as validações de autorização de maneira declarativa.

### 3. Componentização de UI no Frontend (Vue 3)
- **Decisão**: Reestruturar a aba "Ajustes da Casa" para "Controle de Acesso" no arquivo `ConfiguracoesMembros.vue`.
- **Decisão**: Utilizar um componente de **Bottom Sheet** que desliza de baixo para cima ao clicar em uma linha de morador.
- **Raciocínio**: Em dispositivos móveis, abrir um dropdown ou ter muitos botões pequenos em uma lista compacta prejudica a usabilidade (erros de clique). O Bottom Sheet com botões de tamanho apropriado e switches oferece uma experiência de sistema nativo móvel de alta qualidade.
- **Switches de Leitura**: A lista de permissões granulares no Bottom Sheet usará switches (`[🟢]` para ativo, `[⚪]` para inativo) com a propriedade `disabled` ou `read-only` ativa, servindo puramente de apoio visual explicativo ao alterar o cargo nas tabs de seleção superior.

### 4. Segurança do Usuário Logado
- **Decisão**: Bloquear ações de auto-despromoção ou auto-desativação no frontend e backend.
- **Detecção**: O sistema identificará se o `membroId` que está sendo editado é igual ao do usuário atualmente logado ou se ele é o único `ADMIN` com status `ativo: true` no banco para o respectivo tenant. Se for o caso, as ações de desativação e troca de cargo serão desabilitadas, exibindo um alerta.

## Risks / Trade-offs

- **[Risco] Bloqueio Acidental de Acesso** → O último administrador ativo se desativar ou rebaixar seu cargo, deixando a casa sem gerentes.
  * *Mitigação*: Lógica estrita no backend (`MembroService`) e no frontend impedindo que a contagem de administradores ativos na casa seja menor que 1 em alterações de cargo ou desativações.
- **[Risco] Latência Visual** → O administrador atualiza o cargo de um membro, mas outros membros na moradia continuam vendo as informações desatualizadas.
  * *Mitigação*: Disparar um evento de atualização via Socket.IO/WebSockets quando houver mudança de cargos ou status de membros, forçando a recarga da listagem de membros em tempo real para todos os clientes conectados naquele tenant.
