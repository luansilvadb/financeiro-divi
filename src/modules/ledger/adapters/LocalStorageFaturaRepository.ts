import type { IFaturaRepository } from '../core/ports/IFaturaRepository'
import { Fatura } from '../core/domain/Fatura'
import type { FaturaPeriodo } from '../core/domain/Fatura'
import { StorageLock } from '../../../shared/utils/StorageLock'

export class LocalStorageFaturaRepository implements IFaturaRepository {
  private readonly STORAGE_KEY = 'divi_faturas'

  async salvar(fatura: Fatura): Promise<void> {
    await StorageLock.executarAtomico('lock_divi_faturas', async () => {
      const todas = await this.listarTodas()
      const index = todas.findIndex(f => f.id === fatura.id)
      if (index >= 0) {
        todas[index] = fatura
      } else {
        todas.push(fatura)
      }
      const dtos = todas.map(f => ({
        id: f.id,
        cartaoId: f.cartaoId,
        periodo: f.periodo,
        responsavelId: f.responsavelId,
        status: f.status,
        dataPagamentoBanco: f.dataPagamentoBanco ? f.dataPagamentoBanco.toISOString() : undefined
      }))
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dtos))
    })
  }

  async buscarPorId(id: string): Promise<Fatura | null> {
    const todas = await this.listarTodas()
    return todas.find(f => f.id === id) || null
  }

  async buscarPorCartaoEPeriodo(cartaoId: string, periodo: FaturaPeriodo): Promise<Fatura | null> {
    const todas = await this.listarTodas()
    return todas.find(f => f.cartaoId === cartaoId && f.periodo.mes === periodo.mes && f.periodo.ano === periodo.ano) || null
  }

  async listarTodas(): Promise<Fatura[]> {
    const data = localStorage.getItem(this.STORAGE_KEY)
    if (!data) return []
    try {
      const raw = JSON.parse(data) as any[]
      return raw.map(f => new Fatura({
        ...f,
        dataPagamentoBanco: f.dataPagamentoBanco ? new Date(f.dataPagamentoBanco) : undefined
      }))
    } catch (e) {
      console.error(e)
      return []
    }
  }
}
