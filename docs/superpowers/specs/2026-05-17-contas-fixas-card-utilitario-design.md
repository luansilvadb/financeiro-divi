# Card Utilitario de Contas Fixas

## Objetivo

Redesenhar `ContasFixasPanel.vue` como um card limpo e utilitario, seguindo `DESIGN.md`, sem alterar o comportamento de lancar, configurar ou adicionar contas fixas.

## Direcao Visual

- Usar card branco com inset shadow warm-stone, raio de 10px e padding contido.
- Remover o tratamento `glass-card`, tokens antigos `divi-*` no card principal e raios grandes demais.
- Manter leitura densa: cabecalho simples, contador em pill claro e linhas compactas.
- Usar paineis creme para cada conta, com status discreto por ponto colorido e texto curto.
- Usar `Lancar` como pill escuro quando a conta estiver pendente.
- Usar configurar como botao pequeno e discreto.
- Manter o estado vazio, mas menos expressivo que a versao ilustrada atual.

## Fora de Escopo

- Alterar regras de status pago/pendente.
- Alterar modais de lancamento ou configuracao.
- Alterar persistencia, dominio ou composables.
