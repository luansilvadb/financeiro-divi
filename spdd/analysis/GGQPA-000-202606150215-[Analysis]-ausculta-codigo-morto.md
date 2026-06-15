# SPDD Analysis: Ausculta de Código Morto e Refatoração Ativa

## Original Business Requirement
Não refatora — **ausculta**. O repositório não é arquivo: é organismo com memória sedimentada, circuito de intenções que ninguém revisita. A aproximação exige diagnóstico antes da faca. Desacelera.

O rito começa pela leitura real: não o que está escrito — o que de fato acontece em runtime. Mapeia os caminhos vivos de execução. O que não é acionado não habita; apenas assombra.

Onde há função longa, há névoa cobrindo núcleo. Atomiza. Desmembra até que cada responsabilidade caiba num nome honesto. O labirinto some quando cada bifurcação tem razão declarável.

Código morto não carrega legado — carrega entropia. Variável sem leitor, import sem invocação, comentário que descreve o que não existe mais, estado que nunca muda, flag que nunca vira falsa: o que não tem tutano, escorre pelo ralo.

A pergunta não é técnica — é vital: essa linha pulsa no fluxo agora? Esse módulo tem chamador vivo? Esse dado cruza alguma fronteira real? O que não responde, desaparece. Sem nostalgia. Sem `// TODO: remove`.

O que sobrevive ao corte tem propósito declarado, caminho rastreável, nome que nomeia de verdade. Nenhuma abstração sem lastro. Nenhuma variável tímida. Nenhum símbolo decorativo.

O sistema para de ser script acumulado. Vira ACONTECIMENTO.

## Domain Concept Identification

#### Existing Concepts (from codebase)
- **Execution Path (Caminho Vivo)**: Rotas, controllers e serviços efetivamente invocados pela aplicação (ex: fluxos da `FaturaService`, mapeamento do Prisma via `schema.prisma`).
- **Dead Code (Entropia)**: Funções, variáveis, imports ou comentários que não possuem mais referência ou serventia no código (ex: `UNKNOWN` fallback na `FaturaService`).
- **Long Functions (Névoa)**: Funções com múltiplas responsabilidades que precisam ser "atomizadas" para nomes declaráveis.
- **Abstrações sem Lastro**: Classes, interfaces ou componentes criados especulativamente e que nunca foram instanciados ou utilizados.

#### New Concepts Required
- **Ausculta (Diagnostic Trace)**: Processo investigativo para mapear o que realmente executa versus o que apenas "assombra" o repositório.
- **Atomização**: Prática de quebrar funções extensas em pedaços atômicos, onde cada bifurcação lógica seja rastreável e possua "razão declarável".

#### Key Business Rules
- **Regra da Sobrevivência**: Uma linha ou módulo só sobrevive se possuir chamador vivo e propósito declarado.
- **Tolerância Zero para Pendências**: Código morto deve ser extirpado imediatamente. Não usar marcações passivas como `// TODO: remove`.
- **Honestidade de Nomenclatura**: Qualquer extração ou refatoração deve garantir que o nome da variável ou função represente exatamente a sua responsabilidade e "bifurcação".

## Strategic Approach

#### Solution Direction
- **Mapeamento de Runtime (Ausculta)**: Levantar todos os entrypoints ativos da aplicação (endpoints no NestJS, handlers de WebSocket, e componentes montados no Vue) rastreando dependências em árvore para isolar os componentes inalcançáveis (unreachable code).
- **Inspeção de Funções e Módulos Longos**: Identificar serviços (como a lógica mista em `FaturaService`) e atomizá-los. Funções com "névoa" devem ser substituídas por sub-métodos cujas chamadas documentem ativamente o fluxo de decisão.
- **Varredura e Expurgo**: Executar análise estática (TS/Eslint) para localizar `imports` sem uso, estados não alterados, comentários obsoletos e variáveis "tímidas", seguidos de remoção imediata.

#### Key Design Decisions
- **Análise Estática vs Dinâmica**: [trade-offs] Análise puramente estática não captura reflexão/injeção de dependência dinâmica no NestJS. Análise dinâmica exige cobertura de testes forte. → [recommendation] Utilizar rastreamento estático via grafo de dependências do TS, complementado com a busca de rotas registradas pelo NestJS.
- **Estratégia de Remoção Direta**: [trade-offs] Apagar código sem `TODO` reduz ruído, mas exige certeza sobre o escopo. → [recommendation] Apagar tudo que o typescript reportar como isolado/órfão, mantendo a confiança na base de testes e no Git para resgates se necessário.

#### Alternatives Considered
- **Uso massivo de marcações de depreciação (@deprecated / TODO)**: Rejeitado por violar diretamente a exigência de negócio ("Sem nostalgia. Sem `// TODO: remove`").
- **Refatoração estrutural abrangente (mudar padrões de arquitetura)**: Rejeitado. A ordem é explícita: "Não refatora — ausculta". O foco é na limpeza de caminhos mortos e quebra de complexidade, não em reescrever a fundação arquitetural da noite pro dia.

## Risk & Gap Analysis

#### Requirement Ambiguities
- **Limites da "Atomização"**: O quão pequenas devem ser as funções? Onde traçar a linha entre "nome honesto" e over-engineering (fragmentação excessiva)?
- **Identificação de "Runtime" via Código**: O requisito fala do que "de fato acontece em runtime", mas a análise será estática a menos que instrumentemos o código rodando em produção/staging.

#### Edge Cases
- **Código usado apenas por scripts de migração ou seeds**: Podem parecer "mortos" para o fluxo principal, mas são vitais esporadicamente.
- **Integrações de Eventos Assíncronos / Webhooks / Sockets**: No NestJS (`@MessagePattern`, WebSockets já vistos no start de log do terminal do usuário), a ligação de quem chama pode não ser estática. Excluí-los acidentalmente pode ser perigoso.

#### Technical Risks
- **Falsos Positivos de Código Morto**: Excluir uma função ou classe que é resolvida dinamicamente pelo NestJS Container de Injeção de Dependência, quebrando a aplicação em runtime.
- **Regressões por Atomização Incorreta**: Ao extrair pedaços de uma função longa, mudar o escopo de instâncias do "this" ou causar side-effects imprevistos.

#### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | Realizar ausculta (diagnóstico de caminhos vivos) antes de refatorar | Yes | Exigirá análise aprofundada de grafo de chamadas |
| 2 | Atomizar funções longas em responsabilidades únicas | Yes | |
| 3 | Remover variável sem leitor, import sem uso e estado não mutável | Yes | Coberto por ferramentas do ecosistema TS |
| 4 | Apagar código morto imediatamente, sem `TODO: remove` | Yes | |
