import { computed } from 'vue'
import { Fatura } from '../models/entities/Fatura'
import { Cartao } from '../models/entities/Cartao'
import { useCartoesEFaturas } from './useCartoesEFaturas'
import { useContasFixas } from './useContasFixas'
import { useDashboardUIState } from './useDashboardUIState'
import { useDashboardPeriodos } from './useDashboardPeriodos'
import { useDashboardNetting } from './useDashboardNetting'
import { valorParcelaAtual } from '../models/entities/ParcelaCalculator'
import { formatarMesAno, NOMES_MESES } from '../shared/utils/meses'
import { useToast } from '../composables/useToast'
import { gastoPertenceAoPeriodo } from '../shared/utils/gastoPeriodo'
import { gastoService, faturaService } from '../shared/container'

export interface DashboardProps { membros: { id: string; nome: string }[]; faturasAbertas: Fatura[]; faturasFechadas: Fatura[]; cartoes: Cartao[] }

export const useDashboardViewModel = (props: DashboardProps, emit: any) => {
  const ui = useDashboardUIState()
  const ts = useToast()
  const cx = useCartoesEFaturas()
  const cf = useContasFixas()
  const pd = useDashboardPeriodos(() => props.faturasAbertas, () => props.faturasFechadas, () => props.cartoes, () => props.membros, emit)
  
  const p = pd.periodoSelecionado
  const g = cx.gastos

  const sel = computed(() => g.value.filter(x => gastoPertenceAoPeriodo(x, p.value.mes, p.value.ano, cx.faturas.value)))
  
  const parc = computed(() => sel.value
    .filter(x => x.installments > 1)
    .map(x => ({ 
      id: x.id, descricao: x.descricao, responsavel: x.cardOwner ? 'Cartão' : 'Pix', 
      restantes: x.installments - 1, 
      valorParcela: (x.valorTotal.centavos / x.totalInstallments) / 100, 
      totalFuturo: ((x.valorTotal.centavos / x.totalInstallments) * (x.installments - 1)) / 100 
    })))
    
  const cab = computed(() => g.value
    .filter(x => x.method === 'card' && !x.isSettlement && !x.isLoan)
    .reduce((acc, x) => { 
      x.divisoes.forEach(d => { 
        const v = valorParcelaAtual(d.valor, x.installments, x.totalInstallments).centavos
        if (v > 0) acc[d.membroId] = (acc[d.membroId] || 0) + v 
      })
      return acc 
    }, {} as Record<string, number>))

  return {
    ...pd, 
    ...useDashboardNetting(computed(() => props.membros), sel), 
    ...ui, 
    contasFixas: cf.contasFixas, 
    gastosFaturaSelecionada: sel, 
    parcelasFuturasDetalhadas: parc, 
    previaCartaoAbertoPorMembroCentavos: cab,
    
    totalFuturasVencer: computed(() => parc.value.reduce((a, x) => a + x.totalFuturo, 0)),
    totalPreviaCartaoAbertoCentavos: computed(() => Object.values(cab.value).reduce((a, v) => a + v, 0)),
    totalPeriodoSelecionado: computed(() => sel.value.filter(x => !x.isSettlement).reduce((s, x) => s + valorParcelaAtual(x.valorTotal, x.installments, x.totalInstallments).centavos, 0)),
    totalLancamentosPeriodoSelecionado: computed(() => sel.value.filter(x => !x.id.startsWith('audit-settlement-') && (!x.isSettlement || x.descricao.includes('Saldo Inicial'))).length),
    
    getMembroNome: (id: string) => props.membros.find(m => m.id === id)?.nome || 'Desconhecido', 
    formatarDinheiro: (c: number) => c / 100, 
    formatarMesAno, 
    showToast: ts.show,
    
    abrirNovoPeriodoBottomSheet: () => ui.abrirNovoPeriodoBottomSheet(pd.faturaAtivaVisualizada.value),
    
    confirmarAjusteGasto: async (d: any) => { 
      await cx.atualizarGasto(ui.gastoParaAjustar.value!.id, d)
      ui.fecharModal('ajustar-gasto')
      ui.gastoParaAjustar.value = null 
    },
    
    confirmarBaixaNetting: async (d: any) => { 
      ui.isSubmittingPix.value = true
      try {
        await gastoService.registrarAcertoNetting({ faturaId: pd.faturaPixPeriodoSelecionado.value!.id, fromMemberId: d.from, toMemberId: d.to, valor: d.valor, descricao: d.descricao, method: d.method })
        ui.fecharModal('netting')
        ui.nettingTarget.value = null
        await cx.inicializar()
      } finally {
        ui.isSubmittingPix.value = false
      }
    },
    
    confirmarLancarBill: async (d: any) => { 
      await cf.lancarGastoContaFixa(pd.faturaPixPeriodoSelecionado.value!.id, ui.billSelecionada.value, d.valorCentavos, d.compradorId, d.splitIds)
      ui.fecharModal('lancar-conta-fixa')
      await cx.inicializar() 
    },
    
    confirmarSalvarTemplate: (t: any) => { 
      cf.salvarContaFixa(t)
      ui.fecharModal('configurar-conta-fixa')
    },
    
    confirmarNovoPeriodo: async () => { 
      const { mes, ano } = p.value
      await Promise.all(pd.faturasPeriodoSelecionado.value.filter(f => f.status === 'ABERTA').map(f => faturaService.fecharFatura(f.id, f.responsavelId, new Date())))
      await faturaService.assegurarFaturasAbertas(cx.cartoes.value, mes === 12 ? 1 : mes + 1, mes === 12 ? ano + 1 : ano)
      await cx.inicializar()
      ui.fecharModal('novo-periodo')
      ts.show(`Mês de ${NOMES_MESES[mes - 1]} encerrado!`, 'success') 
    },
    
    confirmarEstorno: async () => { 
      const i = ui.itemParaEstornar.value!
      const t = ui.itemTypeParaEstornar.value
      ui.fecharModal('confirmacao-estorno')
      ui.itemParaEstornar.value = null
      
      if (t === 'Lançamento') {
        if (i.id.startsWith('audit-settlement-')) return cx.reabrirFatura(i.faturaId)
        await gastoService.excluirGasto(i.id)
        await cx.inicializar()
        ts.show('Estornado', 'success')
      } else { 
        await cf.excluirContaFixa(i.id)
        ui.fecharModal('configurar-conta-fixa')
        ts.show('Conta removida', 'success') 
      } 
    },
    
    estornarContaFixa: (b: any) => ui.abrirConfirmacaoEstornoGasto(sel.value.find(z => z.recurringBillId === b.id)!),
    
    reabrirPeriodoSelecionado: () => Promise.all(props.faturasFechadas.filter(f => f.periodo.mes === p.value.mes && f.periodo.ano === p.value.ano).map(f => cx.reabrirFatura(f.id))),
    
    excluirGasto: async (id: string) => { 
      await gastoService.excluirGasto(id)
      await cx.inicializar()
      ts.show('Lançamento estornado', 'success') 
    }
  }
}

