import type { Dinheiro } from '../entities/Dinheiro'

export interface IAcertoService {
  registrarReembolsoMembro(acertoId: string, valor: Dinheiro, data?: Date): Promise<void>
  marcarPago(acertoId: string, dataPagamento?: Date): Promise<void>
}
