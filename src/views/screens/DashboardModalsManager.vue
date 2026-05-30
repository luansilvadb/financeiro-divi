<script setup lang="ts">
import { unref } from 'vue'
import PopupLancarContaFixa from '../components/ledger/PopupLancarContaFixa.vue'
import BottomSheetConfigurarContaFixa from '../components/ledger/BottomSheetConfigurarContaFixa.vue'
import BottomSheetAcertoCompensacao from '../components/ledger/dashboard/BottomSheetAcertoCompensacao.vue'
import BottomSheetAjustarGasto from '../components/ledger/BottomSheetAjustarGasto.vue'
import BottomSheetConfirmacaoEstorno from '../components/ledger/BottomSheetConfirmacaoEstorno.vue'
import BottomSheetNovoPeriodo from '../components/ledger/dashboard/BottomSheetNovoPeriodo.vue'
import BottomSheetHistorico from '../components/ledger/dashboard/BottomSheetHistorico.vue'
import BottomSheetCasas from '../components/ledger/dashboard/BottomSheetCasas.vue'

const props = defineProps<{
  vm: any
  membrosAtivos: any[]
  cartoes: any[]
  faturasAbertas: any[]
  faturasFechadas: any[]
  casasMultitenant: any
}>()

const isModalNoTopo = (nome: string) => props.vm.isModalNoTopo(nome)
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
      :cartoes="cartoes"
      @close="vm.fecharModal('novo-periodo')"
      @confirm="vm.confirmarNovoPeriodo"
    />

    <BottomSheetAcertoCompensacao 
      :visible="isModalNoTopo('netting')"
      :from-id="unref(vm.nettingTarget)?.from"
      :to-id="unref(vm.nettingTarget)?.to"
      :from-name="vm.getMembroNome(unref(vm.nettingTarget)?.from)"
      :to-name="vm.getMembroNome(unref(vm.nettingTarget)?.to)"
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
      :item-name="unref(vm.itemParaEstornar)?.descricao || unref(vm.itemParaEstornar)?.name"
      :item-value="unref(vm.itemParaEstornar)?.valorTotal ? (unref(vm.itemParaEstornar).valorTotal.centavos / 100) : unref(vm.itemParaEstornar)?.defaultAmount"
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
