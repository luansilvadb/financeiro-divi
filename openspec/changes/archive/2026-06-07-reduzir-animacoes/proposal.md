## Why

O excesso de animações e movimentos contínuos (como a respiração constante dos mascotes, balanço exagerado de cards e slides longos em transições de abas) no app Divi causa fadiga visual e uma leve percepção de lentidão no uso diário. A redução das animações para um estilo minimalista e focado em produtividade melhora o tempo de resposta percebido da interface e otimiza a carga cognitiva, mantendo a identidade acolhedora do produto sem movimentos desnecessários.

## What Changes

* **Aceleração das transições de abas**: Substituição dos slides longos e elásticos por uma transição rápida de fade e translação mínima.
* **Simplificação das ilustrações/mascotes**: Desativação das pernas animadas e do aceno constante de braço nos mascotes em estado normal. A respiração contínua será suavizada e desacelerada drasticamente ou tornada estática.
* **Refinamento dos efeitos de flutuação e rotação globais**: Diminuição severa da amplitude de movimento de `.animate-float` e `.animate-wobble` no arquivo CSS global.
* **Aceleração dos tempos de entrada de tela**: Encurtamento da duração de animações de entrada de telas e modais (`animate-in`) para no máximo 200ms.

## Capabilities

### New Capabilities
<!-- Nenhuma nova funcionalidade está sendo introduzida. -->

### Modified Capabilities
- `reduzir-animacoes-minimalista`: A interface de usuário do sistema SHALL focar na eficiência e produtividade, suavizando ou desligando animações cíclicas de longa duração e reduzindo o tempo de transição das abas e modais.

## Impact

* **Frontend (CSS / Estilo)**: Alterações nas classes utilitárias de animação em `src/main.css`.
* **Componentes Frontend**: Ajuste das propriedades de animação SVG internas no componente de ilustração `src/views/components/ui/IllustrationMascot.vue`.
* **Desempenho**: Redução do uso de processador de animações contínuas baseadas em CPU/GPU em páginas com mascotes ativos.
