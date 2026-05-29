import { AntecipacaoFatura } from '../../entities/AntecipacaoFatura'
import { Dinheiro } from '../../entities/Dinheiro'
import type { IAntecipacaoFaturaRepository } from '../IAntecipacaoFaturaRepository'
import { HttpBaseRepository } from './HttpBaseRepository'

export class HttpAntecipacaoFaturaRepository extends HttpBaseRepository implements IAntecipacaoFaturaRepository {
  private mapToEntity(item: any): AntecipacaoFatura {
    return new AntecipacaoFatura({
      id: item.id,
      faturaId: item.faturaId,
      membroId: item.membroId,
      responsavelId: item.responsavelId,
      valor: Dinheiro.deCentavos(item.valorCentavos),
      data: new Date(item.data),
      observacao: item.observacao ?? null
    })
  }

  async listarTodos(): Promise<AntecipacaoFatura[]> {
    const list = await this.request<any[]>('/financeiro/antecipacoes-fatura')
    return list.map(item => this.mapToEntity(item))
  }

  async buscarPorFatura(faturaId: string): Promise<AntecipacaoFatura[]> {
    const list = await this.listarTodos()
    return list.filter(a => a.faturaId === faturaId)
  }

  async salvar(antecipacao: AntecipacaoFatura): Promise<void> {
    await this.request('/financeiro/antecipacoes-fatura', {
      method: 'POST',
      body: JSON.stringify({
        id: antecipacao.id,
        faturaId: antecipacao.faturaId,
        membroId: antecipacao.membroId,
        responsavelId: antecipacao.responsavelId,
        valorCentavos: antecipacao.valor.centavos,
        data: antecipacao.data,
        observacao: antecipacao.observacao
      })
    })
  }

  async excluir(id: string): Promise<void> {
    await this.request(`/financeiro/antecipacoes-fatura/${id}`, { method: 'DELETE' })
  }
}
