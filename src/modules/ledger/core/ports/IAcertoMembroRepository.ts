import { AcertoMembro } from '../domain/AcertoMembro'

export interface IAcertoMembroRepository {
  buscarPorFatura(faturaId: string): Promise<AcertoMembro[]>
  salvar(acerto: AcertoMembro): Promise<void>
}