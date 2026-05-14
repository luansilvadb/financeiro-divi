import { ITransacaoRepository } from '../core/ports/ITransacaoRepository'
import { Transacao } from '../core/domain/Transacao'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import { Divisao } from '../core/domain/Divisao'

export class LocalStorageTransacaoRepository implements ITransacaoRepository {
  private readonly STORAGE_KEY = 'divi_transactions'

  async salvar(transacao: Transacao): Promise<void> {
    const todas = await this.listarTodas()
    const index = todas.findIndex(t => t.id === transacao.id)
    
    if (index >= 0) {
      todas[index] = transacao
    } else {
      todas.push(transacao)
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(todas))
  }

  async buscarPorId(id: string): Promise<Transacao | null> {
    const todas = await this.listarTodas()
    return todas.find(t => t.id === id) || null
  }

  async listarTodas(): Promise<Transacao[]> {
    const data = localStorage.getItem(this.STORAGE_KEY)
    if (!data) return []

    const raw = JSON.parse(data) as any[]
    return raw.map(t => new Transacao({
      ...t,
      total: Dinheiro.deCentavos(t.total.centavos),
      data: new Date(t.data),
      divisoes: t.divisoes.map((d: any) => new Divisao(d.beneficiario_id, Dinheiro.deCentavos(d.valor.centavos)))
    }))
  }
}
