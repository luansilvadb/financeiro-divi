import type { ITransacaoRepository } from '../core/ports/ITransacaoRepository'
import { Transacao } from '../core/domain/Transacao'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import { Divisao } from '../core/domain/Divisao'
import { StorageLock } from '../../../shared/utils/StorageLock'

export class LocalStorageTransacaoRepository implements ITransacaoRepository {
  private readonly STORAGE_KEY = 'divi_transactions'

  async salvar(transacao: Transacao): Promise<void> {
    await StorageLock.executarAtomico('lock_divi_transactions', async () => {
      const todas = await this.listarTodas()
      const index = todas.findIndex(t => t.id === transacao.id)
      
      if (index >= 0) {
        todas[index] = transacao
      } else {
        todas.push(transacao)
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(todas))
    })
  }

  async buscarPorId(id: string): Promise<Transacao | null> {
    const todas = await this.listarTodas()
    return todas.find(t => t.id === id) || null
  }

  async listarTodas(): Promise<Transacao[]> {
    const data = localStorage.getItem(this.STORAGE_KEY)
    if (!data) return []

    try {
      const raw = JSON.parse(data) as any[]
      const transacoes: Transacao[] = []

      for (const t of raw) {
        try {
          // Validação básica de estrutura
          if (!t.total || typeof t.total.centavos !== 'number') continue
          if (!t.divisoes || !Array.isArray(t.divisoes)) continue

          const transacao = new Transacao({
            ...t,
            total: Dinheiro.deCentavos(t.total.centavos),
            data: new Date(t.data),
            pagamentos: (t.pagamentos || [])
              .filter((p: any) => p.valor && typeof p.valor.centavos === 'number')
              .map((p: any) => ({
                membro_id: p.membro_id,
                valor: Dinheiro.deCentavos(p.valor.centavos)
              })),
            divisoes: t.divisoes
              .filter((d: any) => d.valor && typeof d.valor.centavos === 'number')
              .map((d: any) => new Divisao(d.beneficiario_id, Dinheiro.deCentavos(d.valor.centavos)))
          })
          transacoes.push(transacao)
        } catch (e) {
          console.error('Ignorando transação corrompida:', t.id, e)
        }
      }

      return transacoes
    } catch (e) {
      console.error('Erro ao ler LocalStorage, limpando dados corrompidos:', e)
      return []
    }
  }
}
