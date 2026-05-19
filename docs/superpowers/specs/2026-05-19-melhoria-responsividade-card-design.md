# Especificação Técnica: Remoção de Badges e Otimização de Responsividade nos Cabeçalhos

## 1. Contexto & Problema

Nos cabeçalhos dos cards principais do dashboard (`Últimos Lançamentos`, `Contas Fixas` e `Saldos Unificados`), havia um padrão flexível horizontal (`flex justify-between items-center`) que exibia um badge lateral à direita (como `X movimentações`, `Y/Z pagas` e `LIVE`). 

Em dispositivos móveis com larguras de tela reduzidas (menores que 400px, comuns em smartphones menores como iPhone SE ou dispositivos de 320px-360px), o título e o badge brigavam por espaço na mesma linha. Isso causava:
- Quebra de linha indesejada do título da seção.
- Alinhamento vertical descompensado dos badges.
- Espremimento geral de elementos de texto, degradando a experiência do usuário.

## 2. Abordagem Escolhida

Para resolver a responsividade de forma definitiva e elevar o nível de consistência visual premium do Divi, foi decidido **remover completamente os badges** de todas as resoluções (Desktop & Mobile).

Dessa forma, os três cabeçalhos principais do dashboard terão o exato mesmo padrão minimalista, focado na semântica do título e ícone:
1. **Saldos Unificados** (Ícone: `TrendingUp`, Legenda: `Créditos e débitos da casa`)
2. **Contas Fixas** (Ícone: `Repeat`, Legenda: `Recorrentes do mês`)
3. **Últimos Lançamentos** (Ícone: `Clock`, Legenda: `Atividade recente no período`)

## 3. Arquivos a Serem Modificados

### 3.1. `src/components/ledger/ActivityFeed.vue` (Últimos Lançamentos)
- **Remover:** O badge `<span>{{ sortedGastos.length }} movimentações</span>`.
- **Simplificar:** A classe do container principal de `flex justify-between items-center` para `flex items-center`.

### 3.2. `src/components/ledger/ContasFixasPanel.vue` (Contas Fixas)
- **Remover:** O badge `<span>{{ pagasCount }}/{{ contasFixas.length }} pagas</span>`.
- **Simplificar:** A classe do container principal de `flex justify-between items-center` para `flex items-center`.

### 3.3. `src/components/ledger/DashboardSaldos.vue` (Saldos Unificados)
- **Remover:** O badge `<span>LIVE</span>`.
- **Simplificar:** A classe do container principal de `flex justify-between items-center` para `flex items-center`.

## 4. Plano de Verificação

Após as alterações, realizaremos as seguintes etapas de verificação:
1. Inspeção do código modificado para garantir que nenhuma lógica funcional importante (como reações computadas do Vue) foi quebrada indesejadamente.
2. Garantia de que a compilação do Vite (`npm run build` ou similar) continua gerando os assets corretamente sem erros de lint ou build.
