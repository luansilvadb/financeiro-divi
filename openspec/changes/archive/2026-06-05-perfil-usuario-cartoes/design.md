## Context

Atualmente, o painel de configurações (Ajustes Gerais) é acoplado como um único Bottom Sheet com a gestão de todos os moradores e cartões de crédito. A interface não possui contexto do usuário autenticado no cabeçalho e permite que qualquer membro cadastre cartões e atribua a responsabilidade a qualquer outro morador ou exclua cartões de terceiros. Isso impacta negativamente a privacidade e a segurança do aplicativo.

## Goals / Non-Goals

**Goals:**
*   **Identidade Visual Pessoal:** Substituir o botão de engrenagem no cabeçalho pelo avatar do usuário ativo na casa, servindo como atalho para o seu perfil.
*   **Segurança de Cartões (UX):** Garantir que os cartões sejam cadastrados e excluídos exclusivamente pelos seus respectivos donos.
*   **Separação de Contextos:** Dividir a visualização em abas claras:
    *   **Meu Perfil:** Dados do usuário logado, botão de logout e gerenciamento de cartões próprios.
    *   **Ajustes da Casa:** Informações coletivas da casa (link de convite e lista de moradores).
*   **Mapeamento de Usuário no Frontend:** Expor e utilizar a relação entre `Usuario` e `MembroCasa` no frontend para identificar o membro atual logado.

**Non-Goals:**
*   Implementação de regras de autorização/políticas rígidas no backend (nesta etapa focaremos em garantir a segurança pela lógica e UX do frontend).
*   Permitir a transferência de propriedade de cartões após o cadastro.

## Decisions

### 1. Adicionar `userId` à Entidade `Membro`
*   **Opção Considerada A:** Manter o modelo `Membro` inalterado e criar outro endpoint/fluxo para buscar o membro logado.
*   **Opção Considerada B (Escolhida):** Adicionar `userId` opcional ao modelo `Membro` e mapeá-lo no `HttpMembroRepository.ts`.
*   **Razão da Escolha:** A API `/financeiro/membros` já retorna o `userId` em cada objeto membro. Mapeá-lo no repositório existente é extremamente simples, de baixo impacto e evita requisições redundantes.

### 2. Atribuição Automática de Dono no Cadastro de Cartão
*   **Decisão:** Remover o dropdown de seleção de responsável em `ConfiguracoesCartoes.vue` e passar automaticamente o `currentMembro.id` (morador correspondente ao usuário ativo) como `responsavelPadraoId` na chamada de criação.
*   **Razão:** Isso remove a brecha de cadastrar cartões em nome de outros membros e simplifica o fluxo de entrada de dados para o usuário.

### 3. Filtro de Gerenciamento de Cartões no Perfil
*   **Decisão:** Na aba "Meu Perfil", o componente de cartões só exibirá para listagem e exclusão os cartões pertencentes ao usuário logado (`c.responsavelPadraoId === currentMembro.id`).
*   **Razão:** Garante que o usuário só gerencie o que é seu por direito, enquanto a visibilidade geral dos cartões da casa permanece garantida nas áreas de rateio e lançamento.

## Risks / Trade-offs

*   **[Risco]** Usuário logado que não possui um vínculo de `MembroCasa` associado no banco.
    *   **Mitigação:** Os fluxos de criação de casa e entrada por convite no backend (`criarTenant` e `entrarTenantPorCodigo`) já garantem a associação automática de um `MembroCasa` com o `userId` do usuário logado. No frontend, caso `currentMembro` seja nulo por algum estado inconsistente, exibiremos dados genéricos de usuário no perfil e desabilitaremos o cadastro de cartões, exibindo uma mensagem de alerta.
