import { ref, computed } from 'vue'
import { LocalStorageCartaoRepository } from '../adapters/LocalStorageCartaoRepository'
import { LocalStorageFaturaRepository } from '../adapters/LocalStorageFaturaRepository'
import { LocalStorageGastoRepository } from '../adapters/LocalStorageGastoRepository'
import { LocalStorageAntecipacaoRepository } from '../adapters/LocalStorageAntecipacaoRepository'
import { LocalStorageAcertoMembroRepository } from '../adapters/LocalStorageAcertoMembroRepository'
import { FaturaService } from '../core/services/FaturaService'
import { AcertoService } from '../core/services/AcertoService'
import { Cartao } from '../core/domain/Cartao'
import { Fatura } from '../core/domain/Fatura'
import { AcertoMembro } from '../core/domain/AcertoMembro'
import { Gasto } from '../core/domain/Gasto'
import { Antecipacao } from '../core/domain/Antecipacao'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import { DivisaoDeGasto } from '../core/domain/DivisaoDeGasto'

const cartaoRepo = new LocalStorageCartaoRepository()
const faturaRepo = new LocalStorageFaturaRepository()
const gastoRepo = new LocalStorageGastoRepository()
const antRepo = new LocalStorageAntecipacaoRepository()
const acertoRepo = new LocalStorageAcertoMembroRepository()

const faturaService = new FaturaService(faturaRepo, gastoRepo, antRepo, acertoRepo)
const acertoService = new AcertoService(acertoRepo, faturaRepo)

const cartoes = ref<Cartao[]>([])
const faturas = ref<Fatura[]>([])
const acertos = ref<AcertoMembro[]>([])
const gastos = ref<Gasto[]>([])
const antecipacoes = ref<Antecipacao[]>([])
const inicializado = ref(false)
let promiseInicializacao: Promise<void> | null = null

export function useCartoesEFaturas() {
  const inicializar = async () => {
    if (promiseInicializacao) return promiseInicializacao
    
    const carregar = async () => {
      const todosCartoes = await cartaoRepo.listarTodos()
      cartoes.value = todosCartoes

      // Inicializar faturas abertas padrão caso não existam para todos os cartões cadastrados
      const hoje = new Date()
      const mesAtual = hoje.getMonth() + 1
      const anoAtual = hoje.getFullYear()
      let todasFaturas = await faturaRepo.listarTodas()

      // --- MIGRAÇÃO E DESDUPLICAÇÃO AUTOMÁTICA DE FATURAS ---
      // 1. Encontrar o período mais recente que está ABERTO
      let maisRecenteAno = 0
      let maisRecenteMes = 0
      for (const f of todasFaturas) {
        if (f.status === 'ABERTA') {
          if (f.periodo.ano > maisRecenteAno || (f.periodo.ano === maisRecenteAno && f.periodo.mes > maisRecenteMes)) {
            maisRecenteAno = f.periodo.ano
            maisRecenteMes = f.periodo.mes
          }
        }
      }

      if (maisRecenteAno === 0) {
        const hoje = new Date()
        maisRecenteMes = hoje.getMonth() + 1
        maisRecenteAno = hoje.getFullYear()
      }

      // 2. Filtrar e agrupar desduplicando
      const faturasUnicas = new Map<string, Fatura>()
      const faturasParaRemover: Fatura[] = []
      
      for (const f of todasFaturas) {
        const chave = `${f.cartaoId}-${f.periodo.mes}-${f.periodo.ano}`
        const existente = faturasUnicas.get(chave)
        if (existente) {
          const isPassado = f.periodo.ano < maisRecenteAno || (f.periodo.ano === maisRecenteAno && f.periodo.mes < maisRecenteMes)
          
          let manter = existente
          let remover = f
          
          if (!isPassado) {
            // Período atual/futuro -> Mantém a ABERTA
            if (f.status === 'ABERTA' && existente.status !== 'ABERTA') {
              manter = f
              remover = existente
            }
          } else {
            // Período passado -> Mantém a FECHADA/ACERTADA
            if (f.status !== 'ABERTA' && existente.status === 'ABERTA') {
              manter = f
              remover = existente
            }
          }
          
          faturasUnicas.set(chave, manter)
          faturasParaRemover.push(remover)
        } else {
          faturasUnicas.set(chave, f)
        }
      }

      if (faturasParaRemover.length > 0) {
        console.warn(`[Divi Migration] Detectadas ${faturasParaRemover.length} faturas duplicadas. Iniciando migração...`)
        const todosGastos = await gastoRepo.listarTodos()
        
        for (const fRem of faturasParaRemover) {
          const chave = `${fRem.cartaoId}-${fRem.periodo.mes}-${fRem.periodo.ano}`
          const fMant = faturasUnicas.get(chave)!
          
          const gastosMigrar = todosGastos.filter(g => g.faturaId === fRem.id)
          for (const g of gastosMigrar) {
            const novoGasto = new Gasto({
              id: g.id,
              faturaId: fMant.id,
              descricao: g.descricao,
              valorTotal: g.valorTotal,
              compradorId: g.compradorId,
              divisoes: g.divisoes,
              installments: g.installments,
              isLoan: g.isLoan,
              borrowerId: g.borrowerId,
              recurringBillId: g.recurringBillId,
              isSettlement: g.isSettlement,
              settlementDetails: g.settlementDetails,
              method: g.method,
              cardOwner: g.cardOwner
            })
            await gastoRepo.salvar(novoGasto)
          }
        }
        
        const listaLimpa = Array.from(faturasUnicas.values())
        localStorage.setItem('divi_faturas', JSON.stringify(listaLimpa.map(f => ({
          id: f.id,
          cartaoId: f.cartaoId,
          periodo: f.periodo,
          responsavelId: f.responsavelId,
          status: f.status,
          dataPagamentoBanco: f.dataPagamentoBanco ? f.dataPagamentoBanco.toISOString() : undefined
        }))))
        todasFaturas = listaLimpa
      }

      for (const card of todosCartoes) {
        const temFatura = todasFaturas.some(f => f.cartaoId === card.id && f.status === 'ABERTA')
        if (!temFatura) {
          const novaFatura = new Fatura({
            id: crypto.randomUUID(),
            cartaoId: card.id,
            periodo: { mes: mesAtual, ano: anoAtual },
            responsavelId: card.responsavelPadraoId,
            status: 'ABERTA'
          })
          await faturaRepo.salvar(novaFatura)
          todasFaturas.push(novaFatura)
        }
      }
      faturas.value = todasFaturas

      // Carregar acertos, gastos e antecipações
      const todosAcertos: AcertoMembro[] = []
      const todosGastos: Gasto[] = []
      const todasAnt: Antecipacao[] = []
      for (const f of todasFaturas) {
        const porFaturaAcertos = await acertoRepo.buscarPorFatura(f.id)
        todosAcertos.push(...porFaturaAcertos)

        const porFaturaGastos = await gastoRepo.buscarPorFatura(f.id)
        todosGastos.push(...porFaturaGastos)

        const porFaturaAnt = await antRepo.buscarPorFatura(f.id)
        todasAnt.push(...porFaturaAnt)
      }
      acertos.value = todosAcertos
      gastos.value = todosGastos
      antecipacoes.value = todasAnt
      inicializado.value = true
    }

    promiseInicializacao = carregar()
    try {
      await promiseInicializacao
    } finally {
      promiseInicializacao = null
    }
  }

  // Chamar inicializar() automaticamente de forma lazy
  if (!inicializado.value) {
    inicializar()
  }

  const salvarCartaoManual = async (cartao: Cartao) => {
    await cartaoRepo.salvar(cartao)
    await inicializar()
  }

  const excluirCartaoManual = async (id: string) => {
    await cartaoRepo.excluir(id)
    await inicializar()
  }

  const fecharFaturaManual = async (faturaId: string, responsavelId?: string) => {
    await faturaService.fecharFatura(faturaId, responsavelId, new Date())
    await inicializar()
  }

  const reabrirFaturaManual = async (faturaId: string) => {
    await faturaService.reabrirFatura(faturaId)
    await inicializar()
  }

  const quitarAcertoMembro = async (acertoId: string) => {
    await acertoService.marcarPago(acertoId, new Date())
    await inicializar()
  }

  const registrarAdiantamentoManual = async (antecipacao: Antecipacao) => {
    await antRepo.salvar(antecipacao)
    await inicializar()
  }

  const confirmarAcertosManual = async (faturaId: string) => {
    await faturaService.confirmarAcertos(faturaId)
    await inicializar()
  }

  const registrarReembolsoParcialManual = async (acertoId: string, valor: Dinheiro) => {
    await acertoService.registrarReembolsoMembro(acertoId, valor, new Date())
    await inicializar()
  }

  const registrarPagamentoBancoManual = async (faturaId: string) => {
    await faturaService.registrarPagamentoBanco(faturaId, new Date())
    await inicializar()
  }

  const removerPagamentoBancoManual = async (faturaId: string) => {
    await faturaService.removerPagamentoBanco(faturaId)
    await inicializar()
  }

  const atualizarGastoCompletoManual = async (
    gastoId: string,
    dados: {
      descricao: string
      valorTotal: Dinheiro
      compradorId: string
      method: 'pix' | 'card'
      cardOwner: string | null
      divisoes: DivisaoDeGasto[]
      installments: number
    }
  ) => {
    const listGastos = gastos.value
    const idx = listGastos.findIndex(g => g.id === gastoId)
    if (idx < 0) return

    const original = listGastos[idx]
    const novoGasto = new Gasto({
      id: original.id,
      faturaId: original.faturaId,
      descricao: dados.descricao,
      valorTotal: dados.valorTotal,
      compradorId: dados.compradorId,
      divisoes: dados.divisoes,
      method: dados.method,
      cardOwner: dados.cardOwner,
      installments: dados.installments,
      isLoan: original.isLoan,
      borrowerId: original.borrowerId,
      recurringBillId: original.recurringBillId,
      isSettlement: original.isSettlement,
      settlementDetails: original.settlementDetails
    })

    await gastoRepo.salvar(novoGasto)
    await inicializar()
  }

  const faturasAbertas = computed(() => faturas.value.filter(f => f.status === 'ABERTA'))
  const faturasFechadas = computed(() => faturas.value.filter(f => f.status === 'FECHADA'))

  const calcularConsumoMembro = (faturaId: string, membroId: string) => {
    const gastosDaFatura = gastos.value.filter(g => g.faturaId === faturaId)
    let total = 0
    gastosDaFatura.forEach(g => {
      g.divisoes.forEach(d => {
        if (d.membroId === membroId) {
          total += d.valor.centavos / g.installments
        }
      })
    })
    return total
  }

  const calcularAdiantamentoMembro = (faturaId: string, membroId: string) => {
    return antecipacoes.value
      .filter(a => a.faturaId === faturaId && a.membroId === membroId)
      .reduce((sum, a) => sum + a.valor.centavos, 0)
  }

  const resetar = () => {
    cartoes.value = []
    faturas.value = []
    acertos.value = []
    gastos.value = []
    antecipacoes.value = []
    inicializado.value = false
  }

  return {
    cartoes,
    faturas,
    acertos,
    gastos,
    antecipacoes,
    inicializar,
    salvarCartaoManual,
    excluirCartaoManual,
    fecharFaturaManual,
    reabrirFaturaManual,
    quitarAcertoMembro,
    registrarAdiantamentoManual,
    confirmarAcertosManual, // <- NOVO
    registrarReembolsoParcialManual,
    registrarPagamentoBancoManual,
    removerPagamentoBancoManual,
    atualizarGastoCompletoManual,
    faturasAbertas,
    faturasFechadas,
    calcularConsumoMembro,
    calcularAdiantamentoMembro,
    resetar
  }
}
