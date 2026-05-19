import { computed, type Ref } from 'vue'
import { Gasto } from '../core/domain/Gasto'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'

export function useDashboardCalculations(
  membrosRef: Ref<{ id: string; nome: string }[]> | { id: string; nome: string }[],
  faturasAbertas: any[] | Ref<any[]>,
  _faturasFechadas: any[],
  acertosPendentes: any[],
  globalGastos: any[],
  globalAcertos: any[],
  calcularConsumo: (faturaId: string, membroId: string) => number,
  calcularAdiantamento?: (faturaId: string, membroId: string) => number
) {
  const getMembrosList = () => {
    return 'value' in membrosRef ? membrosRef.value : membrosRef
  }

  const getFaturasAbertas = () => {
    return faturasAbertas && 'value' in faturasAbertas ? (faturasAbertas as Ref<any[]>).value : (faturasAbertas as any[])
  }

  const getMembroNome = (id: string) => {
    if (!id) return 'Desconhecido'
    const membros = getMembrosList()
    const membro = membros.find(m => m.id === id)
    if (!membro && membros.length > 0) {
      console.warn(`Member ID not found: ${id}. Available members:`, membros.map(m => ({ id: m.id, nome: m.nome })))
    }
    return membro?.nome || 'Membro desconhecido'
  }

  const getCartaoNome = (cartoes: any[], cartaoId: string) => {
    return cartoes.find(c => c.id === cartaoId)?.nome || 'Cartão'
  }

  const getConsumo = (faturaId: string, membroId: string) => {
    return calcularConsumo(faturaId, membroId)
  }

  const getAdiantamento = (faturaId: string, membroId: string) => {
    return calcularAdiantamento ? calcularAdiantamento(faturaId, membroId) : 0
  }

  const formatarDinheiro = (centavos: number) => {
    return Dinheiro.deCentavos(centavos).centavos / 100
  }

  const calcularTotalFatura = (faturaId: string) => {
    const membros = getMembrosList()
    return membros.reduce((sum: number, m: { id: string }) => sum + getConsumo(faturaId, m.id), 0)
  }

  const acertosDaFatura = (faturaId: string) => {
    const list = acertosPendentes && acertosPendentes.length > 0
      ? acertosPendentes
      : globalAcertos
    return list.filter(a => a.faturaId === faturaId)
  }

  const faturaTemAcertosAtivos = (faturaId: string) => {
    return acertosDaFatura(faturaId).length > 0
  }

  const gastosDaFatura = (faturaId: string) => {
    const list = globalGastos && globalGastos.length > 0
      ? globalGastos
      : []
    return list.filter((g: Gasto) => g.faturaId === faturaId)
  }

  const todosOsAcertosQuitados = (faturaId: string) => {
    const acertos = acertosDaFatura(faturaId)
    return acertos.length > 0 && acertos.every(a => a.pago)
  }

  const currentMonthName = computed(() => {
    const fat = getFaturasAbertas()[0]
    if (!fat) return 'Mês'
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    return meses[fat.periodo.mes - 1]
  })

  const currentYear = computed(() => {
    const fat = getFaturasAbertas()[0]
    if (!fat) return 'Atual'
    return fat.periodo.ano.toString()
  })

  const sugerirProximoPeriodo = () => {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    const fat = getFaturasAbertas()[0]
    if (!fat) return ''
    const mIdx = fat.periodo.mes - 1 // 0-indexed
    const proximoMIdx = (mIdx + 1) % 12
    const proximoAno = proximoMIdx === 0 ? fat.periodo.ano + 1 : fat.periodo.ano
    return `${meses[proximoMIdx]} ${proximoAno}`
  }

  const parcelasFuturasDetalhadas = computed(() => {
    const list: any[] = []
    const fatAtiva = getFaturasAbertas()[0]
    if (!fatAtiva) return list

    const gastosDaFaturaAtiva = gastosDaFatura(fatAtiva.id)

    gastosDaFaturaAtiva.forEach((g: Gasto) => {
      if (g.installments > 1) {
        const valorParcela = g.valorTotal.centavos / g.installments
        const parcelasRestantes = g.installments - 1
        const totalRestante = valorParcela * parcelasRestantes
        list.push({
          id: g.id,
          descricao: g.descricao,
          responsavel: g.cardOwner ? 'Cartão' : 'Pix',
          restantes: parcelasRestantes,
          valorParcela: valorParcela / 100,
          totalFuturo: totalRestante / 100
        })
      }
    })
    return list
  })

  const totalFuturasVencer = computed(() => {
    return parcelasFuturasDetalhadas.value.reduce((acc, p) => acc + p.totalFuturo, 0)
  })

  return {
    getMembroNome,
    getCartaoNome,
    getConsumo,
    getAdiantamento,
    formatarDinheiro,
    calcularTotalFatura,
    acertosDaFatura,
    faturaTemAcertosAtivos,
    gastosDaFatura,
    todosOsAcertosQuitados,
    currentMonthName,
    currentYear,
    sugerirProximoPeriodo,
    parcelasFuturasDetalhadas,
    totalFuturasVencer
  }
}
