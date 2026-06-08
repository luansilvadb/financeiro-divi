## 1. Limpeza de Fantasmas

- [x] 1.1 Remover o arquivo `src/views/components/ui/SectionLabel.vue`
- [x] 1.2 Verificar e remover referências obsoletas em arquivos de documentação (docs/specs/plans) se necessário para evitar confusão futura

## 2. Restauração Semântica (ViewModel)

- [x] 2.1 Renomear abreviações no `src/viewmodels/useDashboardViewModel.ts` para nomes descritivos (ex: `cx` -> `cartoesEFaturas`, `pd` -> `periodos`)
- [x] 2.2 Garantir que todas as referências computadas e funções exportadas mantenham a funcionalidade após a renomeação

## 3. Atomização do Monolito de Membros

- [x] 3.1 Criar subcomponente `src/views/components/ledger/membros/MembroListItem.vue` extraindo o template do loop de moradores
- [x] 3.2 Criar subcomponente `src/views/components/ledger/membros/MembroFormBottomSheet.vue` extraindo o formulário de adição/edição de membros
- [x] 3.3 Criar subcomponente `src/views/components/ledger/membros/CargoFormBottomSheet.vue` extraindo a lógica de gestão de cargos e permissões
- [x] 3.4 Refatorar `src/views/screens/ConfiguracoesMembros.vue` para utilizar os novos subcomponentes, reduzindo a complexidade do arquivo principal

## 4. Simplificação de Skeletons

- [x] 4.1 Revisar `src/views/components/ui/SkeletonMimic.vue` para simplificar a estrutura, focando apenas nos blocos essenciais de carregamento
- [x] 4.2 Validar se a simplificação mantém a experiência de usuário durante o carregamento inicial do dashboard

## 5. Validação e Fechamento do Ritual

- [x] 5.1 Executar testes unitários existentes (`npm test`) para garantir que nenhuma regressão foi introduzida
- [x] 5.2 Executar build de produção (`npm run build`) para confirmar que não existem erros de tipos ou referências quebradas
- [x] 5.3 Validar visualmente a tela de Configurações de Membros e o Dashboard
