import { ref } from 'vue'
import type { ContaFixa } from '../models/entities/ContaFixa'
import type { Gasto } from '../models/entities/Gasto'
import type { IContaFixaRepository } from '../models/repositories/IContaFixaRepository'
import type { IGastoService } from '../models/services/IGastoService'
import { contaFixaRepository, gastoService, tenantSessionService } from '../shared/container'

const CONTAS_PADRAO: ContaFixa[] = [
  { id: 'aluguel', name: 'Aluguel da Casa', icon: '🔑', fixedValueCentavos: 150000, defaultSplit: [] },
  { id: 'luz', name: 'Energia (Luz)', icon: '💡', fixedValueCentavos: null, defaultSplit: [] },
  { id: 'agua', name: 'Água', icon: '💧', fixedValueCentavos: null, defaultSplit: [] },
  { id: 'internet', name: 'Internet', icon: '🌐', fixedValueCentavos: 12000, defaultSplit: [] },
  { id: 'cachorro', name: 'Cuidados Cachorro', icon: '🐶', fixedValueCentavos: null, defaultSplit: [] }
]

const contasFixas = ref<ContaFixa[]>([])
const inicializado = ref(false)
let promiseInicializacao: Promise<void> | null = null

export interface ContasFixasDependencies {
  contaFixaRepository?: IContaFixaRepository
  gastoService?: IGastoService
}

export function useContasFixas(dependencies: ContasFixasDependencies = {}) {
  const contaFixaRepo = dependencies.contaFixaRepository || contaFixaRepository
  const servicoGasto = dependencies.gastoService || gastoService

  const carregarTemplates = async () => {
    if (promiseInicializacao) return promiseInicializacao

    if (tenantSessionService.isAuthenticated() && !tenantSessionService.getActiveTenantId()) {
      contasFixas.value = [...CONTAS_PADRAO]
      inicializado.value = true
      return
    }

    const carregar = async () => {
      const saved = await contaFixaRepo.listarTodas()
      if (saved && saved.length > 0) {
        contasFixas.value = saved
      } else {
        contasFixas.value = [...CONTAS_PADRAO]
        for (const template of CONTAS_PADRAO) {
          await contaFixaRepo.salvar(template)
        }
      }
      inicializado.value = true
    }

    promiseInicializacao = carregar()
    try {
      await promiseInicializacao
    } finally {
      promiseInicializacao = null
    }
  }

  const salvarContaFixa = async (template: ContaFixa) => {
    const idx = contasFixas.value.findIndex(c => c.id === template.id)
    if (idx > -1) {
      contasFixas.value[idx] = template
    } else {
      contasFixas.value.push(template)
    }
    await contaFixaRepo.salvar(template)
  }

  const excluirContaFixa = async (id: string) => {
    contasFixas.value = contasFixas.value.filter(c => c.id !== id)
    await contaFixaRepo.excluir(id)
    await servicoGasto.removerAssociacaoContaFixa(id)
  }

  const verificarStatusPaga = (conta: ContaFixa, gastos: Gasto[]) => {
    const gasto = gastos.find(g => g.recurringBillId === conta.id)
    if (!gasto) return null
    return {
      valorCentavos: gasto.valorTotal.centavos,
      pagoPor: gasto.compradorId
    }
  }

  const lancarGastoContaFixa = async (
    faturaId: string,
    conta: ContaFixa,
    valorCentavos: number,
    compradorId: string,
    participantes: string[]
  ) => {
    await servicoGasto.lancarGastoContaFixa({
      faturaId,
      conta,
      valorCentavos,
      compradorId,
      participantes
    })
  }

  const resetar = () => {
    contasFixas.value = []
    inicializado.value = false
  }


  return {
    contasFixas,
    salvarContaFixa,
    excluirContaFixa,
    verificarStatusPaga,
    lancarGastoContaFixa,
    carregarTemplates,
    resetar
  }
}
