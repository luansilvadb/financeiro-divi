<script setup lang="ts">
import { computed, unref } from 'vue'
import PopupLancarContaFixa from '../components/ledger/PopupLancarContaFixa.vue'
import BottomSheetConfigurarContaFixa from '../components/ledger/BottomSheetConfigurarContaFixa.vue'
import BottomSheetAcertoCompensacao from '../components/ledger/dashboard/BottomSheetAcertoCompensacao.vue'
import BottomSheetAjustarGasto from '../components/ledger/BottomSheetAjustarGasto.vue'
import BottomSheetConfirmacaoEstorno from '../components/ledger/BottomSheetConfirmacaoEstorno.vue'
import BottomSheetNovoPeriodo from '../components/ledger/dashboard/BottomSheetNovoPeriodo.vue'
import BottomSheetHistorico from '../components/ledger/dashboard/BottomSheetHistorico.vue'
import BottomSheetCasas from '../components/ledger/dashboard/BottomSheetCasas.vue'
import type { Cartao } from '../../models/entities/Cartao'
import type { Fatura } from '../../models/entities/Fatura'
import type { DashboardViewModel } from '../../viewmodels/useDashboardViewModel'
import type { CasasModalView } from '../../viewmodels/useCasasMultitenant'

interface MembroResumo {
  id: string
  nome: string
  ativo?: boolean
}

const props = defineProps<{
  vm: DashboardViewModel
  membrosAtivos: MembroResumo[]
  cartoes: Cartao[]
  faturasAbertas: Fatura[]
  faturasFechadas: Fatura[]
  casasMultitenant: CasasModalView
}>()

const isModalNoTopo = (nome: string) => props.vm.isModalNoTopo(nome)
const nomeMembro = (id?: string) => id ? props.vm.getMembroNome(id) : ''
const itemParaEstornar = computed(() => unref(props.vm.itemParaEstornar))
const itemEstornoNome = computed(() => {
  const item = itemParaEstornar.value
  if (!item) return undefined
  return 'descricao' in item ? item.descricao : item.name
})
const itemEstornoValor = computed(() => {
  const item = itemParaEstornar.value
  if (!item) return undefined
  if ('valorTotal' in item) return item.valorTotal.centavos / 100
  return item.fixedValueCentavos === null ? undefined : item.fixedValueCentavos / 100
})
</script>

<template>
  <div>
    <PopupLancarContaFixa 
      :visible="isModalNoTopo('lancar-conta-fixa')"
      :bill="unref(vm.billSelecionada)"
      :membros="membrosAtivos"
      @confirm="vm.confirmarLancarBill"
      @cancel="vm.fecharModal('lancar-conta-fixa')"
    />

    <BottomSheetConfigurarContaFixa 
      :visible="isModalNoTopo('configurar-conta-fixa')"
      :bill="unref(vm.billSelecionada)"
      :membros="membrosAtivos"
      @save="vm.confirmarSalvarTemplate"
      @delete="vm.abrirConfirmacaoEstornoBill"
      @cancel="vm.fecharModal('configurar-conta-fixa')"
    />

    <BottomSheetNovoPeriodo
      :visible="isModalNoTopo('novo-periodo')"
      :vm="vm"
      @close="vm.fecharModal('novo-periodo')"
      @confirm="vm.confirmarNovoPeriodo"
    />

    <BottomSheetAcertoCompensacao 
      :visible="isModalNoTopo('netting')"
      :from-id="unref(vm.nettingTarget)?.from"
      :to-id="unref(vm.nettingTarget)?.to"
      :from-name="nomeMembro(unref(vm.nettingTarget)?.from)"
      :to-name="nomeMembro(unref(vm.nettingTarget)?.to)"
      :suggested-value="unref(vm.nettingTarget)?.val || 0"
      :loading="Boolean(unref(vm.isSubmittingPix))"
      @cancel="vm.fecharModal('netting')"
      @confirm="vm.confirmarBaixaNetting"
    />

    <BottomSheetAjustarGasto 
      :visible="isModalNoTopo('ajustar-gasto')"
      :gasto="unref(vm.gastoParaAjustar)"
      :membros="membrosAtivos"
      :cartoes="cartoes"
      :faturas="[...faturasAbertas, ...faturasFechadas]"
      @cancel="vm.fecharModal('ajustar-gasto')"
      @save="vm.confirmarAjusteGasto"
    />

    <BottomSheetHistorico
      :visible="isModalNoTopo('historico')"
      :vm="vm"
      :faturas-fechadas="faturasFechadas"
      @close="vm.fecharModal('historico')"
    />

    <BottomSheetConfirmacaoEstorno 
      :visible="isModalNoTopo('confirmacao-estorno')"
      :item-type="unref(vm.itemTypeParaEstornar) || ''"
      :item-name="itemEstornoNome"
      :item-value="itemEstornoValor"
      @cancel="vm.fecharModal('confirmacao-estorno')"
      @confirm="vm.confirmarEstorno"
    />

    <BottomSheetCasas
      :visible="isModalNoTopo('casas')"
      :casas-multitenant="casasMultitenant"
      @close="vm.fecharModal('casas')"
    />
  </div>
</template>
