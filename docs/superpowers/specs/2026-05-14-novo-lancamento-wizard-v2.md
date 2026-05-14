# Spec: Wizard de Novo Lançamento V2 (Premium)

**Data:** 2026-05-14
**Status:** Em Revisão
**Objetivo:** Otimizar a experiência de registro de transações, reduzindo a carga cognitiva e o número de interações através de um fluxo mais fluido e visualmente guiado.

## 1. Identidade Visual e Navegação (UI)

- **Stepper:** Barra de progresso contínua ("Progress Fill") no topo do card.
  - Visual: Linha fina de 4px, fundo cinza claro, preenchimento azul (#3b82f6) animado.
  - Texto auxiliar: "Passo X de 4" em fonte pequena e cinza.
- **Rodapé Fixo (Sticky Footer):** Os botões de navegação ("Voltar" e "Próximo/Salvar") ficam fixos na base do componente, garantindo acessibilidade mesmo com teclados virtuais ativos.
- **Animações:** Transições laterais suaves entre os passos para reforçar a ideia de progressão.

## 2. Fluxo UX Otimizado (3 Passos)

### Passo 1: Intenção (Avanço Automático)

- **Pergunta:** "O que você deseja registrar?"
- **Opções:** "Um gasto" / "Um ganho".
- **UX:** Ao clicar em uma opção, o wizard avança automaticamente para o Passo 2.

### Passo 2: Dados Base (Fusão)

- **Pergunta:** "Quais os dados do lançamento?"
- **Campos:**
  1.  **Valor:** Destaque numérico (R$ 0,00) com teclado numérico focado por padrão.
  2.  **Descrição:** Input de texto logo abaixo ("O que você comprou?" ou "De onde veio?").
- **UX:** O botão "Próximo" só habilita quando o valor for > 0 e a descrição não estiver vazia.

### Passo 3: Intenção de Divisão

- **Pergunta:** "Quem participa desse lançamento?"
- **Opções:**
  - **Membros selecionados:** Abre o Grid de Membros para seleção múltipla.
- **Visual:** Cálculo em tempo real do valor "Para cada um" conforme membros são marcados.

## 3. Requisitos Técnicos

- **Componente:** Refatorar `src/components/ledger/NovoLancamentoWizard.vue`.
- **Persistência:** Manter rascunho no `localStorage` (`divi_rascunho_v2`).
- **Responsividade:** O layout deve se adaptar para mobile (telas pequenas) usando classes do Tailwind CSS.
- **Componentização:** Extrair `ProgressBar.vue` e `StepFooter.vue` se necessário para manter o código limpo.

## 4. Definição de Pronto (DoR)

- [ ] Barra de progresso reflete corretamente os 3 passos.
- [ ] Passo 1 avança sem clique extra no botão.
- [ ] Valor e Descrição coexistem no Passo 2.
- [ ] Botões de navegação não são "empurrados" para fora da tela pelo teclado.
- [ ] Transação é salva corretamente no repositório ao finalizar.
