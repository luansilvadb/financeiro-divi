# SPDD Analysis: Desativar Zoom Mobile para Experiência PWA Nativa

## Original Business Requirement
Como estamos fazendo um PWA eu quero chegar o mais proximo da experiência nativa, atualmente o zoom está tirando a imersão do usuario mobile, precisamos desativar a funcionalidade de zoom.

## Domain Concept Identification

### Existing Concepts (from codebase)
- **Viewport Config (HTML Template)**: A tag meta viewport em [index.html](file:///d:/projetos/financeiro-divi/index.html), que define a escala inicial e o dimensionamento da janela de exibição da aplicação no navegador.
- **Global Stylesheet**: O arquivo [main.css](file:///d:/projetos/financeiro-divi/src/main.css) contendo regras de estilo aplicadas globalmente para toda a aplicação.
- **Application Bootstrap (main.ts)**: O arquivo [main.ts](file:///d:/projetos/financeiro-divi/src/main.ts), responsável por inicializar a aplicação Vue e fazer a montagem no DOM.

### New Concepts Required
- **Pinch-to-Zoom Prevention (Prevenção de Zoom de Pinça)**: Lógica no bootstrap do cliente para interceptar e mitigar gestos de pinça multitoque que causam zoom indesejado no iOS Safari.
- **Double-Tap Zoom Prevention (Prevenção de Zoom de Toque Duplo)**: Configuração de folha de estilos (CSS) para remover o delay de 300ms e evitar zoom automático ao tocar repetidamente em elementos interativos.
- **Focus Auto-Zoom Prevention (Prevenção de Zoom de Foco)**: Garante que o navegador móvel não faça zoom na página quando um input de texto receber foco.

### Key Business Rules
- **Imersão de App Nativo**: O PWA deve se comportar como um aplicativo móvel nativo, mantendo a escala de exibição fixa (100% de escala) e ignorando gestos de zoom (pinch e duplo toque) para evitar desalinhar a UI.
- **Interação Fluida**: A desativação do zoom não deve impedir interações legítimas de toque, rolagem (scroll vertical/horizontal) e cliques rápidos em botões.

---

## Strategic Approach

### Solution Direction
Propomos uma abordagem em três camadas para garantir a máxima compatibilidade e consistência em dispositivos Android (Chrome, Firefox, etc.) e iOS (Safari):

1. **Camada HTML (Meta Viewport)**:
   Atualizar a tag viewport em [index.html](file:///d:/projetos/financeiro-divi/index.html) para incluir `maximum-scale=1.0` e `user-scalable=no`.
2. **Camada CSS (Estilo Global)**:
   Configurar no [main.css](file:///d:/projetos/financeiro-divi/src/main.css) a propriedade `touch-action: pan-x pan-y` no elemento `body` ou `html`, de modo a desativar double-tap e pinch-to-zoom padrão, mantendo a rolagem fluida. Além disso, aplicar `text-size-adjust: none` e `-webkit-text-size-adjust: none` para impedir que o iOS ajuste automaticamente o tamanho do texto em mudanças de orientação.
3. **Camada JavaScript (Event Interception)**:
   Adicionar listeners globais em [main.ts](file:///d:/projetos/financeiro-divi/src/main.ts) para bloquear gestos multitoques (pinch) e o evento proprietário `gesturestart` do iOS Safari, que costuma ignorar as diretivas da tag meta viewport.

### Key Design Decisions
- **Decisão: Prevenção via JavaScript para iOS**: Optou-se por interceptar eventos de toque e gestos no JavaScript além de usar metatags e CSS.
  *Trade-offs*: Introduz um pequeno overhead de escuta de eventos no nível do document, porém é a única solução 100% eficaz para iOS Safari modernos (versões 10+), que ignoram a tag `user-scalable=no` do HTML para fins de acessibilidade padrão.
- **Decisão: Configurar font-size de inputs >= 16px no CSS**: No iOS, se qualquer campo de input tiver fonte menor que 16px, o Safari fará zoom automático na página ao focar no campo. Precisamos certificar que os inputs da aplicação utilizem no mínimo 16px (ou `text-base` do Tailwind) para evitar o auto-zoom.
  *Trade-offs*: Pode exigir pequenos ajustes visuais se existirem inputs muito compactos, mas previne a quebra de layout de forma limpa.

### Alternatives Considered
- **Uso exclusivo de meta viewport (`user-scalable=no`)**: 
  *Por que foi rejeitado*: Não funciona no iOS Safari moderno, pois a Apple deliberadamente desabilitou o suporte ao bloqueio de zoom por metatags para priorizar a acessibilidade do navegador, forçando desenvolvedores de PWAs a usarem alternativas via JS e CSS.

---

## Risk & Gap Analysis

### Requirement Ambiguities
- **Inputs compactos com fontes pequenas**: O design atual pode ter inputs de texto ou selects com fonte menor que 16px. Ao focar neles, o Safari iOS dará zoom automático de foco que prejudica a imersão. Devemos mapear se existem campos com fontes menores para mitigação.

### Edge Cases
- **Comportamento do Scroll Horizontal**: O uso de `touch-action` restritivo no body pode, por vezes, interferir em carrosséis ou componentes com rolagem horizontal interna (ex: tabelas de gastos, abas horizontais). Devemos usar `touch-action: pan-x pan-y` no body (que permite rolagem em ambos os eixos) ou aplicar `touch-action: manipulation` no body combinando com JS preventivo.
- **Leitura em dispositivos menores**: Em telas muito pequenas (ex: iPhone SE), a desativação do zoom impede que usuários aproximem a tela para ler textos pequenos. Isso exige que o design e tamanho de fontes do PWA sejam impecáveis e sigam as diretrizes de acessibilidade (WCAG).

### Technical Risks
- **Prevenção de Toque Legítimo**: Eventuais listeners de toque com `preventDefault` agressivos no JS podem travar gestos legítimos em componentes interativos mais complexos. Os interceptores de toque devem ser limitados apenas ao gesto de pinça (`event.touches.length > 1`) e devem ser registrados de forma não-bloqueante sempre que possível, exceto quando o gesto for explicitamente de zoom.

### Acceptance Criteria Coverage

| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | O duplo toque rápido em elementos interativos não deve fazer zoom na tela (Double-tap zoom desativado). | Yes | Resolvido com `touch-action: manipulation` no CSS global. |
| 2 | O gesto de pinça com dois dedos não deve alterar a escala visual da aplicação (Pinch-to-zoom desativado). | Yes | Resolvido por listeners preventivos em `main.ts` e metatag viewport. |
| 3 | O foco em campos de formulário (inputs, textareas, selects) não deve disparar o zoom de foco automático nos navegadores móveis. | Yes | Garantir que o tamanho da fonte dos inputs seja de pelo menos 16px no CSS/Tailwind e configurar a escala máxima no HTML. |
