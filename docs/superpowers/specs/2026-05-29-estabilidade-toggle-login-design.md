# Estabilidade do DOM no Toggle de Login

Esta especificação aborda a eliminação de flickering e comportamentos erráticos ao acionar repetidamente o botão "+ Criar Login" / "Remover Login" no painel de membros.

## Problema
Atualmente, o botão de alternância e o formulário de login usam diretivas `v-if`/`v-else` no Vue. Isso resulta em:
1. Destruição e recriação dos elementos DOM do botão toda vez que o estado `mostrarCredenciais` muda.
2. Perda do elemento físico que estava sob o cursor do mouse entre os cliques rápidos do usuário.
3. Flickers visuais e pulos de layout decorrentes de recálculos abruptos (reflow) do navegador.

## Solução Proposta
Manter a estrutura estável no DOM eliminando o `v-if` para estas partes interativas, adotando `v-show` e controle condicional de estilos CSS.

1. **Unificação dos Botões:** Substituir os dois botões condicionais por um único botão estável cuja cor e texto mudam dinamicamente.
2. **Exibição dos Inputs:** Substituir o `v-if` dos inputs por `v-show`.
3. **Segurança de Acessibilidade:** Adicionar `:disabled="!mostrarCredenciais"` nos inputs quando ocultos para impedir que ganhem foco por acidente via teclado ou leitores de tela.
4. **Otimização para Mobile (Toque):** Adicionar as classes CSS `select-none`, `[touch-action:manipulation]` e `[-webkit-tap-highlight-color:transparent]` no botão de toggle. Isso impede que cliques rápidos ativem o double-tap zoom do navegador ou a seleção do texto do link, que são as fontes de flicker em mobile.
5. **Debouncing por Timestamp Nativo:** Implementar um filtro matemático de clique físico baseado em timestamp (`Date.now()`). Se o tempo entre cliques consecutivos for menor que 250ms (tempo médio de reação humana rápida), a ação de toggle é descartada de forma síncrona. Isso evita "ghost clicks" de emuladores e double-taps acidentais em mobile.

## Impactos
* **Sem impacto de performance:** Manter esses dois inputs no DOM usa recursos insignificantes.
* **Sem Javascript complexo:** Sem timers, debounces ou flags de estado que poderiam introduzir complexidade ou bugs de sincronização.
* **Consistência nos Testes:** Testes automatizados podem validar o estado dos inputs sem depender de ciclos assíncronos de montagem de componentes.

