export interface IFaturaService {
  fecharFatura(faturaId: string, responsavelId?: string, dataPagamentoBanco?: Date): Promise<void>
  confirmarAcertos(faturaId: string): Promise<void>
  reabrirFatura(faturaId: string): Promise<void>
  registrarPagamentoBanco(faturaId: string, data: Date): Promise<void>
  removerPagamentoBanco(faturaId: string): Promise<void>
  assegurarFaturasAbertas(
    cartoes: { id: string; responsavelPadraoId: string }[],
    mes: number,
    ano: number
  ): Promise<any[]>
}
