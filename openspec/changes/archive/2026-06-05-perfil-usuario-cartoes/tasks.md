## 1. Ajustes de Modelos e Repositórios no Frontend

- [x] 1.1 Adicionar propriedade opcional `userId` no construtor da classe `Membro` ([Membro.ts](file:///d:/projetos/financeiro-divi/src/models/entities/Membro.ts))
- [x] 1.2 Mapear a propriedade `userId` retornada da API no repositório ([HttpMembroRepository.ts](file:///d:/projetos/financeiro-divi/src/models/repositories/http/HttpMembroRepository.ts))
- [x] 1.3 Implementar a propriedade computada `currentMembro` no viewmodel de membros ([useMembros.ts](file:///d:/projetos/financeiro-divi/src/viewmodels/useMembros.ts))

## 2. Ajustes na UI e Lógica de Cartões

- [x] 2.1 Atualizar `ConfiguracoesCartoes.vue` para remover o seletor dropdown de "Responsável Principal" do formulário de cadastro
- [x] 2.2 Alterar a ação `adicionarCard` em `ConfiguracoesCartoes.vue` para passar o ID de `currentMembro` como `responsavelPadraoId`
- [x] 2.3 Filtrar a listagem de cartões próprios na tela para exibir e permitir excluir apenas os cartões pertencentes ao usuário logado

## 3. Criação da UI de Perfil do Usuário e Abas

- [x] 3.1 Atualizar `ConfiguracoesMembros.vue` para renomear o título principal para "Perfil do Usuário"
- [x] 3.2 Redesenhar as duas abas do painel: "Meu Perfil" (com nome do usuário logado, avatar, botão de logout e componente de gerenciar cartões filtrado) e "Ajustes da Casa" (convite e moradores)
- [x] 3.3 Adicionar a ação de logout na aba "Meu Perfil" utilizando o `tenantSessionService.logout()`

## 4. Atualização do Cabeçalho da Aplicação

- [x] 4.1 Substituir o botão de engrenagem no cabeçalho ([DashboardHeader.vue](file:///d:/projetos/financeiro-divi/src/views/components/ledger/dashboard/DashboardHeader.vue)) por um botão contendo o avatar do usuário logado (usando o `MembroAvatar` com dados de `currentMembro`)
- [x] 4.2 Ajustar os testes automatizados afetados para refletirem as modificações e garantir que todos os testes do projeto permaneçam passando
