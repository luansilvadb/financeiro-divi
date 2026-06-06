## Why

Atualmente, o aplicativo Divi permite o cadastro e gerenciamento de moradores em uma casa compartilhada sem nenhuma diferenciação de papéis ou permissões (todos os moradores possuem o mesmo nível de acesso e poderes). Além disso, a seção de convites está na aba de "Ajustes da Casa", o que polui a interface e não se adequa à experiência mobile-first ideal. Esta mudança introduz o Controle de Acesso Baseado em Cargos (RBAC), separando as responsabilidades e direitos de Administradores, Moradores comuns e Visualizadores, promovendo maior segurança e clareza.

## What Changes

- **Controle de Acesso Baseado em Cargos (RBAC)**: Introdução dos papéis de `ADMIN`, `MORADOR` e `VISUALIZADOR` para os membros da casa.
- **Nova Identidade da Tela**: Renomeação da aba "Ajustes da Casa" para "Controle de Acesso", focada exclusivamente na gestão de membros e seus respectivos cargos.
- **Remoção de Convites**: O link de convites será removido desta tela por enquanto para ser reaproveitado em outro fluxo futuro.
- **Experiência Mobile-first (Bottom Sheet)**: A alteração de cargo e o status de ativação de um membro passarão a ser gerenciados em um Bottom Sheet de foco, contendo seletores de cargo grandes e um painel informativo de permissões por meio de switches visuais (read-only).
- **Validação de API**: Restrições no backend para garantir que apenas administradores (`ADMIN`) possam gerenciar membros (adicionar, desativar, alterar cargo) e realizar conciliações/fechamentos.

## Capabilities

### New Capabilities

- `controle-acesso-rbac`: Cobertura de regras e fluxos de tela para a gestão de papéis (`ADMIN`, `MORADOR`, `VISUALIZADOR`), detalhando as restrições de ações que cada perfil possui no sistema.

### Modified Capabilities

- `perfil-usuario-cartoes`: Atualização da aba no perfil do usuário para remoção do convite de moradores e atualização do fluxo da lista de membros.

## Impact

- **Banco de Dados**: Alteração no esquema Prisma (`MembroCasa`) para adicionar o campo `role` como enum ou string (default: `MORADOR`).
- **Backend API**:
  - Modificação do DTO e serviço de Membros para trafegar e armazenar a Role.
  - Implementação de um interceptor/guard de segurança para validar se o usuário solicitante possui a Role necessária (ex: `ADMIN` para modificar moradores).
- **Frontend App**:
  - Adaptação do ViewModel de membros e modelo `Membro` para gerenciar a role.
  - Reformulação da view `ConfiguracoesMembros.vue` para remover o link de convites, alterar a nomenclatura e implementar o Bottom Sheet com o visual de switches informativos (read-only) para as permissões do cargo selecionado.
  - Atualização dos testes unitários correspondentes no frontend (`ConfiguracoesMembros.test.ts`).
