# Design Spec: Wizard de Novo Lançamento V2 (Premium)

**Data:** 2026-05-14
**Status:** Aprovado
**Versão:** 2.0.0

## 1. Visão Geral
Transformar o atual `NovoLancamentoWizard.vue` em uma experiência "Premium", focada em micro-interações sutis, tipografia refinada e fluidez de navegação, mantendo a simplicidade e evitando poluição visual.

## 2. Identidade Visual e UI

### 2.1 Stepper (Progresso)
- **Altura:** Reduzida para 4px fixos.
- **Cor:** Fundo `gray-100`, preenchimento `blue-500`.
- **Animação:** `transition-all duration-500 ease-in-out` no preenchimento da barra.
- **Texto:** "Passo X de 3" em fonte `text-[10px] font-black text-gray-400 uppercase tracking-widest`.

### 2.2 Transições de Tela
- **Tipo:** Slide-fade lateral.
- **Implementação:** Uso de Vue `<Transition>` com classes Tailwind:
  - `enter-from`: `opacity-0 translate-x-4`
  - `leave-to`: `opacity-0 -translate-x-4`
  - `duration`: 300ms.

### 2.3 Cards e Inputs
- **Arredondamento:** `rounded-3xl` (24px) para cards e inputs.
- **Sombras:** `shadow-sm` padrão, evoluindo para `shadow-md` em estados ativos.
- **Destaque de Valor:** Container com `bg-blue-50/50` e borda `border-blue-100`. Tipografia `font-mono` para o valor numérico.

## 3. Fluxo UX Detalhado

### Passo 1: Intenção (Avanço Automático)
- O usuário escolhe entre "Gasto" ou "Ganho".
- **Feedback:** O card selecionado recebe uma borda `border-blue-500` por 150ms antes do avanço automático.
- **Avanço:** Transição imediata para o Passo 2 após o clique.

### Passo 2: Dados Base (Fusão)
- **Foco:** Auto-focus no campo de valor.
- **Layout:** Valor e Descrição coexistem verticalmente.
- **Validação:** Botão "Próximo" habilita apenas quando `valor > 0` e `descricao.length > 0`.

### Passo 3: Divisão
- **Seleção:** Membros em grid horizontal ou flex-wrap.
- **Visual:** Bordas coloridas nos avatares indicam seleção de forma discreta.
- **Cálculo:** Exibição do valor rateado em tempo real em um resumo discreto na parte inferior do card.

## 4. Arquitetura Técnica

- **Componente Principal:** `src/components/ledger/NovoLancamentoWizard.vue`.
- **Sub-componentes:**
  - `WizardProgressBar.vue` (Refatorar para 4px).
  - `WizardFooter.vue` (Tornar `sticky` e ajustar responsividade).
- **Estado:** Manter `localStorage` (`divi_rascunho_novo_lancamento`) para persistência de rascunhos.
- **Estilos:** Tailwind CSS utilitário.

## 5. Definição de Pronto (DoR)
- [ ] Barra de progresso com 4px e animação suave.
- [ ] Transições de slide entre os 3 passos.
- [ ] Passo 1 avança automaticamente com feedback sutil.
- [ ] Bloco de valor destacado com `bg-blue-50`.
- [ ] Rodapé fixo no mobile (`sticky bottom-0`).
- [ ] Testes unitários atualizados para cobrir o novo fluxo.
