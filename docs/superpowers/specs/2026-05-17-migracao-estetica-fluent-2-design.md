# Documento de Especificação de Design: Ecossistema Fluent 2 (DIVI)

## 1. Visão Geral e Objetivos
O objetivo desta refatoração é migrar a interface do DIVI para a linguagem visual **Fluent 2 (Windows 11)**. A aplicação deve ser percebida como um "Companion App" nativo, priorizando leveza, transparência acrílica e integração visual com o sistema operacional.

**Direção Escolhida:** Light Mode / Fluent 2 (Light).
**Abordagem de Implementação:** Top-Down (iniciando pelo Shell global).

---

## 2. Design Tokens e Materiais (index.css)

### 2.1. Materiais Físicos
*   **Mica (Fundo Global):** Gradiente matizado sutil para o fundo do `body`.
    *   `linear-gradient(135deg, #F3F6FA 0%, #E8F0F8 100%)`
*   **Acrylic (Superfícies):** Camadas translúcidas com desfoque e saturação.
    *   `background: rgba(255, 255, 255, 0.65)`
    *   `backdrop-filter: blur(30px) saturate(135%)`
*   **Highlight Stroke (Bordas):** Efeito de luz na borda superior dos cartões.
    *   `border: 1px solid rgba(0, 0, 0, 0.08)`
    *   `box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55)`

### 2.2. Paleta de Cores (CSS Variables)
*   **Accent (Windows Blue):** `#0078D4` (Hover: `#106EBE`, Active: `#005A9E`)
*   **Semântico Verde (Excel Green):** `#107C41` (para itens pagos/liquidados)
*   **Semântico Vermelho:** `#A80000` (para exclusões/erros)
*   **Tipografia:** 
    *   Primária: `#201F1E` (P1)
    *   Secundária: `#605E5C` (P2)
    *   Auxiliar: `#A19F9D` (P3)

### 2.3. Geometria (Radii)
*   `f-sm`: `4px` (Inputs, Tags)
*   `f-md`: `8px` (Cards de Dashboard, Widgets)
*   `f-lg`: `12px` (Moldura da Janela App.vue)

---

## 3. Arquitetura de Componentes

### 3.1. App Shell (App.vue)
A aplicação será envolta em uma moldura que simula uma janela nativa:
*   **Title Bar:** Barra superior de 32px-40px com ícone do app e controles de janela (─ ❐ ✕).
*   **Janela Acrílica:** Container central com `max-width: 430px`, bordas arredondadas `12px` e sombra profunda.

### 3.2. Dashboard (DashboardSaldos.vue)
*   **Estilo Widget:** Cards individuais para faturas e saldos usando `.acrylic-card`.
*   **Hover-Lift:** Elevação suave ao passar o mouse, aprofundando a sombra e clareando o fundo.
*   **Barras de Progresso:** Altura de 4px, cantos 2px, fundo cinza-claro sutil, preenchimento em azul acentuado.

### 3.3. Wizard (NovoLancamentoWizard.vue)
*   **Step Dots:** Marcadores horizontais finos de 4px de altura. O passo ativo expande sua largura (padrão Win11).
*   **Fluent Inputs:** Linha de base azul acentuada (2px) que aparece no foco, sobre um fundo levemente acinzentado.
*   **Navegação:** Botões de ação dispostos no rodapé, com o botão primário (Próximo/Confirmar) sempre à direita.

---

## 4. Interações e Animações
*   **Curva de Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (característica do Fluent).
*   **Durações:** Entre 150ms (transições de cor) e 300ms (elevações e slides).

---

## 5. Plano de Validação
1.  **Consistência de Tokens:** Verificar se todas as cores e raios derivam das variáveis do `tailwind.config.js`.
2.  **Efeito Acrílico:** Testar em diferentes resoluções se o `backdrop-filter` mantém a legibilidade do texto.
3.  **Fluxo Wizard:** Garantir que a troca de passos ocorra com a suavidade esperada do ecossistema Fluent.
