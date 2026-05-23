import type { IAcertoMembroRepository } from '../IAcertoMembroRepository'
import { AcertoMembro } from '../../entities/AcertoMembro'
import { Dinheiro } from '../../entities/Dinheiro'
import { StorageLock } from '../../../shared/utils/StorageLock'

export class LocalStorageAcertoMembroRepository implements IAcertoMembroRepository {
  private readonly STORAGE_KEY = 'divi_acertos_membro'

  async salvar(acerto: AcertoMembro): Promise<void> {
    await StorageLock.executarAtomico('lock_divi_acertos_membro', async () => {
      const todos = await this.listarTodos()
      const index = todos.findIndex(a => a.id === acerto.id)
      if (index >= 0) {
        todos[index] = acerto
      } else {
        todos.push(acerto)
      }
      const dtos = todos.map(a => ({
        id: a.id,
        faturaId: a.faturaId,
        membroId: a.membroId,
        totalConsumidoCentavos: a.totalConsumido.centavos,
        valorPagoCentavos: a.valorPago.centavos,
        pago: a.pago,
        dataPagamento: a.dataPagamento ? a.dataPagamento.toISOString() : undefined
      }))
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dtos))
    })
  }

  async buscarPorId(id: string): Promise<AcertoMembro | null> {
    const todos = await this.listarTodos()
    return todos.find(a => a.id === id) || null
  }

  async buscarPorFatura(faturaId: string): Promise<AcertoMembro[]> {
    const todos = await this.listarTodos()
    return todos.filter(a => a.faturaId === faturaId)
  }

  async excluirPorFatura(faturaId: string): Promise<void> {
    await StorageLock.executarAtomico('lock_divi_acertos_membro', async () => {
      const todos = await this.listarTodos()
      const filtrados = todos.filter(a => a.faturaId !== faturaId)
      const dtos = filtrados.map(a => ({
        id: a.id,
        faturaId: a.faturaId,
        membroId: a.membroId,
        totalConsumidoCentavos: a.totalConsumido.centavos,
        valorPagoCentavos: a.valorPago.centavos,
        pago: a.pago,
        dataPagamento: a.dataPagamento ? a.dataPagamento.toISOString() : undefined
      }))
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dtos))
    })
  }

  async listarTodos(): Promise<AcertoMembro[]> {
    const data = localStorage.getItem(this.STORAGE_KEY)
    if (!data) return []
    try {
      const raw = JSON.parse(data) as any[]
      return raw.map(a => {
        const totalConsumido = Dinheiro.deCentavos(a.totalConsumidoCentavos)
        
        // Retrocompatibilidade para quando totalAntecipadoCentavos existia:
        // O valor real da dívida era consumido - antecipado.
        // Se a.totalAntecipadoCentavos existe, devemos considerar que a dívida real (valorAcerto)
        // era o saldo líquido. Porém, como estamos removendo o conceito, o mais seguro
        // para dados legados é manter o que já estava pago ou assumir que o novo totalConsumido
        // é o valor de acerto se não houver antecipação.
        // Mas o plano diz para eliminar totalAntecipado de AcertoMembro.
        
        let valorPago = a.valorPagoCentavos !== undefined
          ? Dinheiro.deCentavos(a.valorPagoCentavos)
          : (a.pago ? totalConsumido : Dinheiro.deCentavos(0))

        return new AcertoMembro({
          id: a.id,
          faturaId: a.faturaId,
          membroId: a.membroId,
          totalConsumido,
          valorPago,
          pago: a.pago,
          dataPagamento: a.dataPagamento ? new Date(a.dataPagamento) : undefined
        })
      })
    } catch (e) {
      console.error('Erro grave de integridade no banco de dados local de acertos de membros:', e)
      throw new Error('Banco de dados local de acertos de membros corrompido. Operação abortada para evitar perda de dados.')
    }
  }
}
