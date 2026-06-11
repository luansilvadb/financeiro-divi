## 1. Segurança e Validação no Backend

- [x] 1.1 Implementar a restrição de segurança no `FinanceiroService.salvarCartao` no backend para validar se o `responsavelPadraoId` enviado coincide com o ID de membro do usuário autenticado na requisição.
- [x] 1.2 Adicionar testes unitários em `financeiro.service.spec.ts` para validar o comportamento de bloqueio caso um usuário tente criar ou alterar um cartão definindo outro membro como responsável padrão.

## 2. Ajuste de Dados Padrão no Frontend

- [x] 2.1 Modificar `src/viewmodels/useContasFixas.ts` para desativar a auto-população silenciosa de contas padrão quando a busca inicial retorna uma lista vazia.
- [x] 2.2 Atualizar os testes unitários do frontend em `src/viewmodels/useContasFixas.test.ts` para certificar-se de que a listagem de contas vazia é mantida vazia se nenhuma operação explícita for acionada.

## 3. Implementação do Wizard de Onboarding no Frontend

- [x] 3.1 Criar a estrutura e controle de estado do Wizard de criação de moradia (etapas 1 a 4) no componente `TenantSelectorScreen.vue` seguindo as diretrizes visuais do `DESIGN.md`.
- [x] 3.2 Implementar a etapa do Passo 2 (Seleção de Contas Fixas) renderizando a lista sugerida (Aluguel, Luz, Água, Internet, Pet, Limpeza), permitindo customizar os valores e criar novas contas dinamicamente.
- [x] 3.3 Implementar a etapa do Passo 3 (Cadastro de Cartões) com campos para Nome do Cartão e Dia de Fechamento, omitindo o campo de responsável (que será implicitamente o usuário logado).
- [x] 3.4 Adicionar lógica de submissão no frontend para criar a casa, receber o ID do Tenant/Membro do criador e, na sequência, disparar as chamadas assíncronas para criar as contas fixas e cartões selecionados.
- [x] 3.5 Implementar a etapa do Passo 4 (Sucesso) exibindo o resumo das configurações salvas, o código de convite gerado, botão rápido de cópia e a transição para a dashboard.

## 4. Testes e Verificação

- [x] 4.1 Executar a suíte de testes unitários do frontend com Vitest e garantir que todos passem sem erros.
- [x] 4.2 Executar a suíte de testes de integração e unitários do backend com Jest e garantir que continuem passando.
- [x] 4.3 Efetuar verificação manual criando um novo usuário e passando por todo o fluxo do onboarding parametrizando contas fixas e cartões de crédito.
