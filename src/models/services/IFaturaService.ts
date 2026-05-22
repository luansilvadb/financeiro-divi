export interface IFaturaService {
  fecharFatura(faturaId: string, responsavelId?: string, dataPagamentoBanco?: Date): Promise<void>
  reabrirFatura(faturaId: string): Promise<void>
  assegurarFaturasAbertas(
    cartoes: { id: string; responsavelPadraoId: string }[],
    mes: number,
    ano: number
  ): Promise<any[]>
}
