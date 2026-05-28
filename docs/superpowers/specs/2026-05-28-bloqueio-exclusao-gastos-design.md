# Design Spec: Bloqueio de Exclusão de Gastos Comuns com Acertos Confirmados

Documentação do design e comportamento lógico para o bloqueio de exclusão de gastos comuns quando existem acertos de contas (Pix) confirmados no período.

## 1. Comportamento Lógico

### Regra de Negócio
Não é permitido excluir ou estornar gastos comuns em um período (fatura) no qual já existem acertos de contas (reembolsos Pix) confirmados (ou seja, quitados ou pagos parcialmente).
Para que o usuário possa excluir um gasto comum, ele deve primeiro estornar os acertos confirmados do período.

### Definições
*   **Gasto Comum**: Qualquer gasto do período que seja dividido e não seja de cartão de crédito (`!gasto.cardOwner` e `!gasto.isSettlement`).
*   **Acerto Confirmado**: Qualquer acerto de membro (`AcertoMembro`) vinculado ao período (`faturaId`) do gasto que possua status de pago (`pago === true`) ou que já tenha recebido pagamento parcial (`valorPago.centavos > 0`).

### Fluxo de Interceptação no Frontend
No feed de atividades (`ActivityFeed.vue`) ou em qualquer outro lugar onde a exclusão de gastos seja iniciada:
1.  O usuário clica no ícone/botão de exclusão do gasto.
2.  O sistema intercepta a ação chamando a validação:
    *   Verifica se o gasto é comum.
    *   Verifica se o período do gasto possui acertos confirmados.
3.  Se a validação falhar:
    *   O sistema impede a abertura do Bottom Sheet de confirmação de estorno.
    *   Dispara o componente **Toast Message** no topo central da tela com a mensagem de erro.
4.  Se a validação passar:
    *   Abre o Bottom Sheet de confirmação de exclusão normalmente.

## 2. Design de Interface (UI)

O componente de notificação seguirá a **Opção A** (Premium Glassmorphism), contendo:
*   **Posicionamento**: Fixo no topo e centralizado horizontalmente (`fixed top-5 left-1/2 -translate-x-1/2 z-[9999]`).
*   **Aparência**:
    *   Fundo branco translúcido com efeito de vidro fosco (`bg-white/85 backdrop-blur-md`).
    *   Borda sutil avermelhada e sombra projetada suave com aura vermelha/rosa (`shadow-[0_10px_30px_-10px_rgba(225,29,72,0.15)]`).
    *   Ícone de escudo de alerta customizado com gradiente de vermelho para laranja (`#e11d48` a `#f59e0b`).
    *   Texto informativo em cinza-escuro (`text-slate-800`), peso semibold.
    *   Botão "X" discreto no canto direito para fechamento manual.
*   **Animação**:
    *   Entrada suave deslizando do topo para baixo.
    *   Saída desvanecendo e deslizando de volta para o topo.
    *   Desaparecimento automático após 4,5 segundos.

## 3. Estrutura de Arquivos Proposta

### [NEW] [useToast.ts](file:///d:/projetos/divi/src/composables/useToast.ts)
Composable para gerenciamento do estado global de Toasts.
```typescript
import { ref } from 'vue'

const visible = ref(false)
const message = ref('')
const type = ref<'error' | 'success' | 'info'>('info')
let timeoutId: any = null

export function useToast() {
  const show = (msg: string, t: 'error' | 'success' | 'info' = 'info', duration = 4500) => {
    message.value = msg
    type.value = t
    visible.value = true
    
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      visible.value = false
    }, duration)
  }

  const hide = () => {
    visible.value = false
    if (timeoutId) clearTimeout(timeoutId)
  }

  return {
    visible,
    message,
    type,
    show,
    hide
  }
}
```

### [NEW] [ToastNotification.vue](file:///d:/projetos/divi/src/views/components/ui/ToastNotification.vue)
Componente visual do Toast flutuante no topo central.
```vue
<script setup lang="ts">
import { useToast } from '../../../composables/useToast'
import { X } from 'lucide-vue-next'

const { visible, message, hide } = useToast()
</script>

<template>
  <Transition name="toast-slide">
    <div 
      v-if="visible" 
      class="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-[420px] bg-white/85 backdrop-blur-md border border-rose-500/20 rounded-xl p-3 flex items-center gap-3 shadow-[0_10px_30px_-10px_rgba(225,29,72,0.15),0_1px_3px_0_rgba(0,0,0,0.05)] pointer-events-auto"
      role="alert"
    >
      <div class="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-rose-500/10">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="url(#toast-gradient-red-orange)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px] animate-pulse">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>

      <div class="flex-1 text-xs md:text-sm font-semibold text-slate-800 leading-relaxed">
        {{ message }}
      </div>

      <button 
        @click="hide" 
        class="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Fechar notificação"
      >
        <X class="w-4 h-4" />
      </button>

      <svg width="0" height="0" class="absolute">
        <defs>
          <linearGradient id="toast-gradient-red-orange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#e11d48" stop-opacity="1" />
            <stop offset="100%" stop-color="#f59e0b" stop-opacity="1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  </Transition>
</template>

<style scoped>
.toast-slide-enter-active {
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
}
.toast-slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.toast-slide-enter-from {
  transform: translateX(-50%) translateY(-120px);
  opacity: 0;
}
.toast-slide-leave-to {
  transform: translateX(-50%) translateY(-120px);
  opacity: 0;
}
</style>
```

### [MODIFY] [App.vue](file:///d:/projetos/divi/src/App.vue)
Inclusão do `<ToastNotification />` no layout global.

### [MODIFY] [useDashboardUIState.ts](file:///d:/projetos/divi/src/viewmodels/useDashboardUIState.ts)
Incluir verificação de validação de exclusão em `abrirConfirmacaoEstornoGasto` (usando os acertos injetados ou providos pela ViewModel), ou tratar diretamente no ViewModel ao interceptar.

### [MODIFY] [useDashboardViewModel.ts](file:///d:/projetos/divi/src/viewmodels/useDashboardViewModel.ts)
Alterar a função `abrirConfirmacaoEstornoGasto` (que é repassada do uiState) para realizar a verificação lógica antes de abrir o bottom sheet:
```typescript
  const abrirConfirmacaoEstornoGasto = (gasto: any) => {
    // 1. Verifica se é gasto comum
    const isComum = !gasto.cardOwner && !gasto.isSettlement
    if (isComum) {
      const acertos = acertosDaFatura(gasto.faturaId)
      const temAcertosConfirmados = acertos.some(a => a.pago || (a.valorPago && a.valorPago.centavos > 0))
      
      if (temAcertosConfirmados) {
        // Dispara o Toast direto e bloqueia
        toast.show('Não é possível excluir gastos comuns neste período pois já existem acertos de contas (Pix) confirmados. Estorne os acertos primeiro', 'error')
        return
      }
    }
    
    // Se passar, abre o modal normalmente
    uiState.abrirConfirmacaoEstornoGasto(gasto)
  }
```
E expor essa função sobrescrita no retorno do `useDashboardViewModel`.
