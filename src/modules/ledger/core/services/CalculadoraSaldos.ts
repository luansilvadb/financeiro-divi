import { Transacao } from '../domain/Transacao'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

export class CalculadoraSaldos {
  static calcular(transacoes: Transacao[]): Map<string, Dinheiro> {
    const saldosCentavos = new Map<string, number>()

    for (const t of transacoes) {
      // Crédito para quem pagou (origem_id)
      const saldoAtualOrigem = saldosCentavos.get(t.origem_id) || 0
      saldosCentavos.set(t.origem_id, saldoAtualOrigem + t.total.centavos)

      // Débito para os beneficiários
      for (const d of t.divisoes) {
        const saldoAtualBeneficiario = saldosCentavos.get(d.beneficiario_id) || 0
        saldosCentavos.set(d.beneficiario_id, saldoAtualBeneficiario - d.valor.centavos)
      }
    }

    const result = new Map<string, Dinheiro>()
    for (const [id, centavos] of saldosCentavos.entries()) {
      result.set(id, Dinheiro.deCentavos(centavos))
    }

    return result
  }
}
