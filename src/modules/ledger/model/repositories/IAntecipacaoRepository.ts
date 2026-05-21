import { Antecipacao } from '../domain/Antecipacao'

export interface IAntecipacaoRepository {
  buscarPorFatura(faturaId: string): Promise<Antecipacao[]>
  salvar(antecipacao: Antecipacao): Promise<void>
}