import { computed } from 'vue'
import { Gasto } from '../models/entities/Gasto'
import { Dinheiro } from '../models/entities/Dinheiro'
import { NOMES_MESES } from '../shared/utils/meses'

export function useDashboardCalculations(
  membros: { id: string; nome: string }[],
  faturasAbertas: any[],
  acertosPendentes: any[],
  globalGastos: any[],
  globalAcertos: any[],
  calcularConsumo: (faturaId: string, membroId: string) => number
) {
  const getMembroNome = (id: string) => {
    if (!id) return 'Desconhecido'
    return membros.find(m => m.id === id)?.nome || 'Membro desconhecido'
  }

  const formatarDinheiro = (centavos: number) => {
    return Dinheiro.deCentavos(centavos).centavos / 100
  }

  const calcularTotalFatura = (faturaId: string) => {
    return membros.reduce((sum, m) => sum + calcularConsumo(faturaId, m.id), 0)
  }

  const acertosDaFatura = (faturaId: string) => {
    const list = acertosPendentes?.length > 0 ? acertosPendentes : globalAcertos
    return list.filter(a => a.faturaId === faturaId)
  }

  const gastosDaFatura = (faturaId: string) => {
    return (globalGastos || []).filter((g: Gasto) => g.faturaId === faturaId)
  }

  const todosOsAcertosQuitados = (faturaId: string) => {
    const acertos = acertosDaFatura(faturaId)
    return acertos.length > 0 && acertos.every(a => a.pago)
  }

  const currentMonthName = computed(() => {
    const fat = faturasAbertas[0]
    if (!fat) return 'Mês'
    return NOMES_MESES[fat.periodo.mes - 1]
  })

  const currentYear = computed(() => {
    const fat = faturasAbertas[0]
    if (!fat) return 'Atual'
    return fat.periodo.ano.toString()
  })

  const parcelasFuturasDetalhadas = computed(() => {
    const fatAtiva = faturasAbertas[0]
    if (!fatAtiva) return []

    return gastosDaFatura(fatAtiva.id)
      .filter((g: Gasto) => g.installments > 1)
      .map((g: Gasto) => {
        const valorParcela = g.valorTotal.centavos / g.installments
        const parcelasRestantes = g.installments - 1
        return {
          id: g.id,
          descricao: g.descricao,
          responsavel: g.cardOwner ? 'Cartão' : 'Pix',
          restantes: parcelasRestantes,
          valorParcela: valorParcela / 100,
          totalFuturo: (valorParcela * parcelasRestantes) / 100
        }
      })
  })

  return {
    getMembroNome,
    formatarDinheiro,
    calcularTotalFatura,
    acertosDaFatura,
    gastosDaFatura,
    todosOsAcertosQuitados,
    currentMonthName,
    currentYear,
    parcelasFuturasDetalhadas
  }
}
