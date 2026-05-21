import { ref } from 'vue'
import type { ContaFixa } from '../model/domain/ContaFixa'
import type { Gasto } from '../model/domain/Gasto'
import { LocalStorageContaFixaRepository } from '../infrastructure/local/LocalStorageContaFixaRepository'
import type { IContaFixaRepository } from '../model/repositories/IContaFixaRepository'
import { LocalStorageGastoRepository } from '../infrastructure/local/LocalStorageGastoRepository'
import { LocalStorageFaturaRepository } from '../infrastructure/local/LocalStorageFaturaRepository'
import { LocalStorageCartaoRepository } from '../infrastructure/local/LocalStorageCartaoRepository'
import { GastoService } from '../model/services/GastoService'

const CONTAS_PADRAO: ContaFixa[] = [
  { id: 'aluguel', name: 'Aluguel da Casa', icon: '🔑', fixedValue: 1500.00, defaultSplit: ['luciana', 'luan', 'joao'] },
  { id: 'luz', name: 'Energia (Luz)', icon: '💡', fixedValue: null, defaultSplit: ['luciana', 'luan', 'joao'] },
  { id: 'agua', name: 'Água', icon: '💧', fixedValue: null, defaultSplit: ['luciana', 'luan', 'joao'] },
  { id: 'internet', name: 'Internet', icon: '🌐', fixedValue: 120.00, defaultSplit: ['luciana', 'luan', 'joao'] },
  { id: 'cachorro', name: 'Cuidados Cachorro', icon: '🐶', fixedValue: null, defaultSplit: ['luciana', 'luan'] }
]

export interface ContasFixasDependencies {
  contaFixaRepository?: IContaFixaRepository
  gastoService?: GastoService
}

export function useContasFixas(dependencies: ContasFixasDependencies = {}) {
  const contaFixaRepo = dependencies.contaFixaRepository || new LocalStorageContaFixaRepository()
  
  const gastoRepo = new LocalStorageGastoRepository()
  const faturaRepo = new LocalStorageFaturaRepository()
  const cartaoRepo = new LocalStorageCartaoRepository()
  const gastoService = dependencies.gastoService || new GastoService(gastoRepo, faturaRepo, cartaoRepo)

  const contasFixas = ref<ContaFixa[]>([])

  const carregarTemplates = async () => {
    const saved = await contaFixaRepo.listarTodas()
    if (saved && saved.length > 0) {
      contasFixas.value = saved
    } else {
      contasFixas.value = [...CONTAS_PADRAO]
      for (const template of CONTAS_PADRAO) {
        await contaFixaRepo.salvar(template)
      }
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
    await gastoService.lancarGastoContaFixa({
      faturaId,
      conta,
      valorTotal,
      compradorId,
      participantes
    })
  }

  carregarTemplates()

  return {
    contasFixas,
    salvarContaFixa,
    excluirContaFixa,
    verificarStatusPaga,
    lancarGastoContaFixa
  }
}
