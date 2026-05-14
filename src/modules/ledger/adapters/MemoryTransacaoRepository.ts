import type { ITransacaoRepository } from '../core/ports/ITransacaoRepository'
import { Transacao } from '../core/domain/Transacao'

export class MemoryTransacaoRepository implements ITransacaoRepository {
  private transacoes: Map<string, Transacao> = new Map()

  async salvar(transacao: Transacao): Promise<void> {
    this.transacoes.set(transacao.id, transacao)
  }

  async buscarPorId(id: string): Promise<Transacao | null> {
    return this.transacoes.get(id) || null
  }

  async listarTodas(): Promise<Transacao[]> {
    return Array.from(this.transacoes.values())
  }
}
