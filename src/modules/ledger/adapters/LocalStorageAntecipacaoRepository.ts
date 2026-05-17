import { IAntecipacaoRepository } from '../core/ports/IAntecipacaoRepository'
import { Antecipacao } from '../core/domain/Antecipacao'
import { Dinheiro } from '../../../shared/primitives/Dinheiro'
import { StorageLock } from '../../../shared/utils/StorageLock'

export class LocalStorageAntecipacaoRepository implements IAntecipacaoRepository {
  private readonly STORAGE_KEY = 'divi_antecipacoes'

  async salvar(antecipacao: Antecipacao): Promise<void> {
    await StorageLock.executarAtomico('lock_divi_antecipacoes', async () => {
      const todas = await this.listarTodas()
      const index = todas.findIndex(a => a.id === antecipacao.id)
      if (index >= 0) {
        todas[index] = antecipacao
      } else {
        todas.push(antecipacao)
      }
      const dtos = todas.map(a => ({
        id: a.id,
        faturaId: a.faturaId,
        membroId: a.membroId,
        valorCentavos: a.valor.centavos,
        data: a.data.toISOString()
      }))
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dtos))
    })
  }

  async buscarPorFatura(faturaId: string): Promise<Antecipacao[]> {
    const todas = await this.listarTodas()
    return todas.filter(a => a.faturaId === faturaId)
  }

  private async listarTodas(): Promise<Antecipacao[]> {
    const data = localStorage.getItem(this.STORAGE_KEY)
    if (!data) return []
    try {
      const raw = JSON.parse(data) as any[]
      return raw.map(a => new Antecipacao({
        id: a.id,
        faturaId: a.faturaId,
        membroId: a.membroId,
        valor: Dinheiro.deCentavos(a.valorCentavos),
        data: new Date(a.data)
      }))
    } catch (e) {
      console.error(e)
      return []
    }
  }
}
