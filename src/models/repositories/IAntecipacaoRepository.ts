import { Antecipacao } from '../entities/Antecipacao'

export interface IAntecipacaoRepository {
  buscarPorFatura(faturaId: string): Promise<Antecipacao[]>
  salvar(antecipacao: Antecipacao): Promise<void>
}