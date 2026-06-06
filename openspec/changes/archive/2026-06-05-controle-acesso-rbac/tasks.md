## 1. Banco de Dados e Backend

- [x] 1.1 Atualizar `backend/prisma/schema.prisma` adicionando o `enum Role` (ADMIN, MORADOR, VISUALIZADOR) e associando ao campo `role` no modelo `MembroCasa` com valor default `MORADOR`.
- [x] 1.2 Gerar e executar a migration do Prisma correspondente (`npx prisma migrate dev`).
- [x] 1.3 Atualizar as classes DTO (`MembroDto`) no backend para receber e validar a propriedade `role` vinda do cliente.
- [x] 1.4 Modificar o serviço de moradores no backend para suportar a alteração do cargo e adicionar a lógica que impede a remoção, desativação ou alteração do cargo do último administrador ativo da moradia (tenant).
- [x] 1.5 Criar o interceptor/decorator `@Roles` e o guard de segurança `TenantRoleGuard` no backend para bloquear a modificação de membros e outras rotas administrativas por usuários que não sejam `ADMIN`.
- [x] 1.6 Garantir que a alteração de cargo ou status do membro dispare o evento de atualização via WebSockets no Gateway correspondente.

## 2. Frontend

- [x] 2.1 Atualizar o modelo de domínio do frontend `src/models/entities/Membro.ts` para incluir a propriedade `role` e o tipo `MembroRole` correspondente.
- [x] 2.2 Atualizar o ViewModel `src/viewmodels/useMembros.ts` para carregar/enviar a propriedade `role` nas requisições de API e expor o método de alteração de cargo.
- [x] 2.3 Ajustar a tela `src/views/screens/ConfiguracoesMembros.vue` trocando o nome da aba "Ajustes da Casa" para "Controle de Acesso" e removendo o componente do card de link de convites.
- [x] 2.4 Implementar o Bottom Sheet móvel de edição de membros na tela (exibido ao tocar em um membro na listagem).
- [x] 2.5 Renderizar os seletores de cargo (estilo abas grandes por toque) e a lista explicativa de permissões contendo switches desabilitados (de leitura) que reagem ao cargo selecionado.
- [x] 2.6 Integrar o switch de ativar/desativar no Bottom Sheet, adicionando validações de interface para desabilitar a ação para o próprio usuário e para o único administrador ativo.

## 3. Testes e Validação

- [x] 3.1 Desenvolver/atualizar testes unitários do backend para validar a proteção de cargos (RBAC) e as travas de segurança do último administrador.
- [x] 3.2 Atualizar os testes unitários do frontend (`src/views/screens/ConfiguracoesMembros.test.ts` e `src/viewmodels/useMembros.test.ts`) para cobrir a mudança de nome da aba e a exibição/interação do Bottom Sheet e seletores.
- [x] 3.3 Realizar validação manual de interface mobile-first simulando o comportamento de toque e reatividade dos switches.
