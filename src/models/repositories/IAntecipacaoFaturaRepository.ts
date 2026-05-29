import type { AntecipacaoFatura } from '../entities/AntecipacaoFatura'

export interface IAntecipacaoFaturaRepository {
  listarTodos(): Promise<AntecipacaoFatura[]>
  buscarPorFatura(faturaId: string): Promise<AntecipacaoFatura[]>
  salvar(antecipacao: AntecipacaoFatura): Promise<void>
  excluir(id: string): Promise<void>
}
