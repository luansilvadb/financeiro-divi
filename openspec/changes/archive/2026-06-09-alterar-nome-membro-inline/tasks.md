## 1. Camada de Serviço (MembroService)

- [x] 1.1 Criar o método `atualizarNomeMembro(id: string, nome: string): Promise<void>` no arquivo `MembroService.ts`.
- [x] 1.2 Adicionar teste unitário para `atualizarNomeMembro` no arquivo `MembroService.test.ts`.

## 2. Camada de ViewModel (useMembros)

- [x] 2.1 Criar e exportar a função `atualizarNomeMembro(id: string, nome: string): Promise<void>` no composable `useMembros.ts`. A função deve invocar o serviço e depois rodar `carregar()`.
- [x] 2.2 Adicionar teste unitário no arquivo `useMembros.test.ts` para garantir o comportamento correto e a sincronização do estado após a edição.

## 3. Componente de Frontend e Interface Visual (ConfiguracoesMembros.vue)

- [x] 3.1 Adicionar estados reativos de controle (`editandoNome`, `nomeEditado`, `salvandoNome`) em `ConfiguracoesMembros.vue`.
- [x] 3.2 Alterar o card de perfil na aba "Meu Perfil" para suportar a alternância entre a exibição estática com ícone de lápis e o input de edição inline com botões [✓] e [✗].
- [x] 3.3 Integrar a ação de salvar com o viewmodel, aplicando validação preventiva contra nomes vazios e emitindo Toast de feedback de sucesso ou erro.
- [x] 3.4 Adicionar testes unitários em `ConfiguracoesMembros.test.ts` cobrindo o fluxo de exibição e alteração do nome do perfil logado.
