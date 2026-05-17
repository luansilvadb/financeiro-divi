import { ref } from 'vue'
import type { ContaFixa } from '../core/domain/ContaFixa'
import { Gasto } from '../core/domain/Gasto'
import { DivisaoDeGasto } from '../core/domain/DivisaoDeGasto'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import { LocalStorageGastoRepository } from '../adapters/LocalStorageGastoRepository'

const STORAGE_KEY = 'divi_contas_fixas_templates_v18'
const gastoRepo = new LocalStorageGastoRepository()

const CONTAS_PADRAO: ContaFixa[] = [
  { id: 'aluguel', name: 'Aluguel da Casa', icon: '🔑', fixedValue: 1500.00, defaultSplit: ['luciana', 'luan', 'joao'] },
  { id: 'luz', name: 'Energia (Luz)', icon: '💡', fixedValue: null, defaultSplit: ['luciana', 'luan', 'joao'] },
  { id: 'agua', name: 'Água', icon: '💧', fixedValue: null, defaultSplit: ['luciana', 'luan', 'joao'] },
  { id: 'internet', name: 'Internet', icon: '🌐', fixedValue: 120.00, defaultSplit: ['luciana', 'luan', 'joao'] },
  { id: 'cachorro', name: 'Cuidados Cachorro', icon: '🐶', fixedValue: null, defaultSplit: ['luciana', 'luan'] }
]

export function useContasFixas() {
  const contasFixas = ref<ContaFixa[]>([])

  const carregarTemplates = () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        contasFixas.value = JSON.parse(saved)
      } catch (e) {
        contasFixas.value = [...CONTAS_PADRAO]
      }
    } else {
      contasFixas.value = [...CONTAS_PADRAO]
      salvarNoStorage()
    }
  }

  const salvarNoStorage = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contasFixas.value))
  }

  const salvarContaFixa = (template: ContaFixa) => {
    const idx = contasFixas.value.findIndex(c => c.id === template.id)
    if (idx > -1) {
      contasFixas.value[idx] = template
    } else {
      contasFixas.value.push(template)
    }
    salvarNoStorage()
  }

  const excluirContaFixa = (id: string) => {
    contasFixas.value = contasFixas.value.filter(c => c.id !== id)
    salvarNoStorage()
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
    const total = Dinheiro.deReais(valorTotal)
    const partes = total.distribuir(participantes.length)
    const divisoes = participantes.map((id, idx) => new DivisaoDeGasto(id, partes[idx]))

    const novoGasto = new Gasto({
      id: crypto.randomUUID(),
      faturaId,
      descricao: `Talão: ${conta.name}`,
      valorTotal: total,
      compradorId,
      divisoes,
      recurringBillId: conta.id,
      installments: 1,
      isLoan: false
    })

    await gastoRepo.salvar(novoGasto)
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
