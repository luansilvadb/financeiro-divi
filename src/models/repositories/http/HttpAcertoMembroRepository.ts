import { HttpBaseRepository } from './HttpBaseRepository'
import { AcertoMembro } from '../../entities/AcertoMembro'
import { Dinheiro } from '../../entities/Dinheiro'
import type { IAcertoMembroRepository } from '../IAcertoMembroRepository'

export class HttpAcertoMembroRepository extends HttpBaseRepository implements IAcertoMembroRepository {
  private mapToEntity(item: any): AcertoMembro {
    return new AcertoMembro({
      id: item.id,
      faturaId: item.faturaId,
      membroId: item.membroId,
      totalConsumido: Dinheiro.deCentavos(item.totalConsumidoCentavos),
      valorPago: Dinheiro.deCentavos(item.valorPagoCentavos),
      pago: item.pago,
      dataPagamento: item.dataPagamento ? new Date(item.dataPagamento) : undefined
    })
  }

  async buscarPorId(id: string): Promise<AcertoMembro | null> {
    const list = await this.listarTodos()
    return list.find(a => a.id === id) || null
  }

  async buscarPorFatura(faturaId: string): Promise<AcertoMembro[]> {
    const list = await this.listarTodos()
    return list.filter(a => a.faturaId === faturaId)
  }

  async salvar(acerto: AcertoMembro): Promise<void> {
    await this.request('/financeiro/acertos', {
      method: 'POST',
      body: JSON.stringify({
        id: acerto.id,
        faturaId: acerto.faturaId,
        membroId: acerto.membroId,
        totalConsumidoCentavos: acerto.totalConsumido.centavos,
        valorPagoCentavos: acerto.valorPago.centavos,
        pago: acerto.pago,
        dataPagamento: acerto.dataPagamento
      })
    })
  }

  async excluirPorFatura(_faturaId: string): Promise<void> {
    // No-op (exclusão por faturas é controlada via cascade no PostgreSQL do backend)
  }

  async listarTodos(): Promise<AcertoMembro[]> {
    const list = await this.request<any[]>('/financeiro/acertos')
    return list.map(item => this.mapToEntity(item))
  }
}
