import { ref } from 'vue'
import type { ContaFixa } from '../models/entities/ContaFixa'
import type { Gasto } from '../models/entities/Gasto'
import type { IContaFixaRepository } from '../models/repositories/IContaFixaRepository'
import type { IGastoService } from '../models/services/IGastoService'
import { contaFixaRepository, gastoService } from '../shared/container'

const CONTAS_PADRAO: ContaFixa[] = [
  { id: 'aluguel', name: 'Aluguel da Casa', icon: '🔑', fixedValue: 1500.00, defaultSplit: ['luciana', 'luan', 'joao'] },
  { id: 'luz', name: 'Energia (Luz)', icon: '💡', fixedValue: null, defaultSplit: ['luciana', 'luan', 'joao'] },
  { id: 'agua', name: 'Água', icon: '💧', fixedValue: null, defaultSplit: ['luciana', 'luan', 'joao'] },
  { id: 'internet', name: 'Internet', icon: '🌐', fixedValue: 120.00, defaultSplit: ['luciana', 'luan', 'joao'] },
  { id: 'cachorro', name: 'Cuidados Cachorro', icon: '🐶', fixedValue: null, defaultSplit: ['luciana', 'luan'] }
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
  }

  const verificarStatusPaga = (conta: ContaFixa, gastos: Gasto[]) => {
    const gasto = gastos.find(g => g.recurringBillId === conta.id)
    if (!gasto) return null
    return {
      valorReal: gasto.valorTotal.centavos / 100,
      pagoPor: gasto.compradorId
    }
  }

  const lancarGastoContaFixa = async (
    faturaId: string,
    conta: ContaFixa,
    valorTotal: number,
    compradorId: string,
    participantes: string[]
  ) => {
    await servicoGasto.lancarGastoContaFixa({
      faturaId,
      conta,
      valorTotal,
      compradorId,
      participantes
    })
  }

  const resetar = () => {
    contasFixas.value = []
    inicializado.value = false
  }

  if (!inicializado.value) {
    carregarTemplates()
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
