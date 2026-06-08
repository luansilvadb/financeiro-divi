## 1. Implementação do Frontend

- [x] 1.1 Reestruturar `ConfiguracoesMembros.vue` para adicionar a navegação de abas no estilo "Floating Island" (Meu Perfil / Controle de Acesso).
- [x] 1.2 Mover a seção com o avatar do usuário logado, seu nome, username e o botão "Sair da Conta" para a aba "Meu Perfil".
- [x] 1.3 Importar e incluir o componente `ConfiguracoesCartoes.vue` na aba "Meu Perfil" de `ConfiguracoesMembros.vue`.
- [x] 1.4 Garantir que a aba "Controle de Acesso" (lista de moradores e cargos) esteja disponível apenas para administradores (`ADMIN`) ou exiba as informações restritas conforme a role do usuário.

## 2. Ajustes nos Testes e Validação

- [x] 2.1 Atualizar `ConfiguracoesMembros.test.ts` para adicionar o stub de `ConfiguracoesCartoes` e validar a alternância de abas.
- [x] 2.2 Executar a suite de testes no Vitest para garantir que não existam regressões.
