## Context

Atualmente, na tela de configurações (`ConfiguracoesMembros.vue`), na aba "Meu Perfil", o nome do morador logado é exibido como texto estático. Embora a API backend e o repositório (`HttpMembroRepository`) permitam o salvamento de dados do membro, não há uma função ou fluxo dedicado para a alteração do nome do usuário logado de forma simplificada, nem um componente visual interativo para esta ação.

## Goals / Non-Goals

**Goals:**
- Implementar a edição inline do nome do usuário logado diretamente no card "Meu Perfil".
- Implementar o método `atualizarNomeMembro` na camada de serviço (`MembroService`) e no ViewModel (`useMembros`).
- Adicionar validações de input no frontend para evitar nomes vazios ou inválidos.
- Garantir a sincronização do estado reativo do membro logado em toda a aplicação em tempo real após a edição.
- Cobrir as alterações com testes unitários adequados.

**Non-Goals:**
- Permitir a alteração do nome de usuário (username) ou senha nesta funcionalidade.
- Permitir a alteração do avatar do morador ou do seu cargo de acesso neste fluxo.
- Alterar nomes de outros moradores (essa ação continua restrita a administradores na aba "Controle de Acesso").

## Decisions

### 1. Edição Inline vs. BottomSheet Dedicada
- **Decisão**: Edição inline. Ao clicar no botão de edição (lápis) ao lado do nome do usuário, o texto estático é substituído por um `<input type="text">` com botões rápidos de salvar (✓) e cancelar (✗).
- **Alternativa Considerada**: Criar uma BottomSheet inteiramente nova para "Editar Perfil".
- **Razão da Escolha**: A edição inline é mais limpa, reduz o número de cliques, mantém o contexto visual da aba e atende melhor à proposta estética "Family" de facilidade e agilidade.

### 2. Fluxo de Salvamento e Persistência
- **Decisão**: Utilizar o método `repository.salvar(membro)` no backend através do `MembroService.atualizarNomeMembro`.
- **Funcionamento**: A service lê o membro existente pelo id, instancia um novo `Membro` com o nome alterado (mantendo os demais atributos como cargo, status ativo, data de criação e userId intactos) e chama o repositório. O viewmodel, por sua vez, aguarda essa chamada e executa `carregar()` para obter os dados atualizados, disparando a reatividade nos componentes baseados em `currentMembro`.

## Risks / Trade-offs

- **[Risco] Salvar nome vazio ou inválido** → **Mitigação**: O formulário do frontend irá validar se o valor limpo (trimmed) do input é não vazio e possui pelo menos 2 caracteres. Caso seja inválido, o salvamento será bloqueado e um Toast de erro será exibido.
- **[Risco] Concorrência visual durante o salvamento** → **Mitigação**: O input e o botão de salvar ficarão desabilitados (`disabled`) e um spinner ou indicador de loading será exibido durante o processo assíncrono para evitar múltiplos cliques.
