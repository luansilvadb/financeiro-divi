# Spec: Ocultar Barra de Navegação durante BottomSheet

**Data:** 2026-05-18
**Status:** Approved
**Topic:** UI/UX Polish

## 1. Problema
O `BottomSheet` (painel inferior) e a `BottomTabBar` (barra de navegação) competem pelo mesmo espaço visual na parte inferior da tela no mobile. Atualmente, ambos possuem `z-index: 50`, o que causa conflitos de sobreposição indesejados. O usuário deseja que o BottomSheet tenha prioridade visual total.

## 2. Solução Proposta
Em vez de apenas ajustar o `z-index`, optamos por uma abordagem de "foco total": ocultar a barra de navegação (`BottomTabBar`) e o botão flutuante (`FAB`) sempre que um `BottomSheet` estiver aberto.

### 2.1 Benefícios
- **Clareza Visual:** Elimina a confusão de camadas.
- **Foco na Tarefa:** O usuário foca exclusivamente no formulário ou configuração aberta no painel.
- **Simplicidade Técnica:** Evita "guerras de z-index" no CSS global.

## 3. Arquitetura e Implementação

### 3.1 Detecção de Estado
Utilizaremos o composable existente `src/composables/useBottomSheetState.ts`, que já gerencia o estado global de abertura de painéis através da propriedade `isAnyBottomSheetOpen`.

### 3.2 Alterações no App.vue
O componente `BottomTabBar` será condicionado à ausência de painéis abertos.

```html
<!-- App.vue -->
<BottomTabBar 
  v-if="!isAnyBottomSheetOpen" 
  v-model="activeTab" 
/>
```

### 3.3 Comportamento do FAB
O FAB já possui uma lógica de ocultação baseada em `isAnyBottomSheetOpen`. Manteremos esse comportamento para consistência.

## 4. Casos de Uso e Testes
1. **Abrir Wizard:** Ao clicar no FAB, a barra de navegação deve desaparecer instantaneamente (ou via transição se aplicada).
2. **Abrir Configurações:** O mesmo comportamento deve ocorrer para o painel de configurações de membros.
3. **Fechar Painel:** Ao fechar o painel (clicando no backdrop ou no botão fechar), a barra de navegação deve reaparecer.

## 5. Riscos e Mitigações
- **Navegação Bloqueada:** O usuário não pode trocar de aba enquanto o painel estiver aberto. 
  - *Mitigação:* Isso é considerado um comportamento desejado para manter a atomicidade da tarefa no painel.
