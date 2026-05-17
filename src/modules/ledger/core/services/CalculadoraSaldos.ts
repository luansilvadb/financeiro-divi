import { Transacao } from '../domain/Transacao'
import { Dinheiro } from '../../../../shared/primitives/Dinheiro'

export interface Acerto {
  de: string
  para: string
  valor: Dinheiro
}

export interface ItemExtrato {
  id: string
  descricao: string
  data: Date
  valorPago: Dinheiro
  valorConsumido: Dinheiro
  valorLiquido: Dinheiro
  saldoAcumulado: Dinheiro
  transacao: Transacao
}

export class CalculadoraSaldos {
  static calcular(transacoes: Transacao[]): Map<string, Dinheiro> {
    const saldosCentavos = new Map<string, number>()

    for (const t of transacoes) {
      // Crédito para quem pagou (pagamentos)
      for (const p of t.pagamentos) {
        const saldoAtualPagador = saldosCentavos.get(p.membro_id) || 0
        saldosCentavos.set(p.membro_id, saldoAtualPagador + p.valor.centavos)
      }

      // Débito para os beneficiários
      for (const d of t.divisoes) {
        const saldoAtualBeneficiario = saldosCentavos.get(d.beneficiario_id) || 0
        saldosCentavos.set(d.beneficiario_id, saldoAtualBeneficiario - d.valor.centavos)
      }
    }

    const result = new Map<string, Dinheiro>()
    for (const [id, centavos] of saldosCentavos.entries()) {
      if (centavos !== 0) {
        result.set(id, Dinheiro.deCentavos(centavos))
      }
    }

    return result
  }

  static calcularAcertos(saldos: Map<string, Dinheiro>): Acerto[] {
    const total = Array.from(saldos.values()).reduce((acc, s) => acc + s.centavos, 0)
    if (total !== 0) {
      throw new Error('Erro de integridade: Os saldos informados para o acerto de contas não estão balanceados.')
    }

    const sortedEntries = Array.from(saldos.entries())
      .sort((a, b) => Math.abs(b[1].centavos) - Math.abs(a[1].centavos))

    const ids = sortedEntries.map(e => e[0])
    const valoresCentavos = sortedEntries.map(e => e[1].centavos)
    const acertos: Acerto[] = []

    this._resolverAcertos(valoresCentavos, ids, acertos)
    return acertos
  }

  private static _resolverAcertos(saldos: number[], ids: string[], acertos: Acerto[]): boolean {
    const i = saldos.findIndex(s => s < 0)
    if (i === -1) return true // todos devedores quitados, sucesso!

    for (let j = 0; j < saldos.length; j++) {
      if (saldos[j] <= 0) continue // pula quem não é credor

      const transferencia = Math.min(Math.abs(saldos[i]), saldos[j])

      // Trabalha em cópia para preservar o estado original para o backtrack
      const novosSaldos = [...saldos]
      novosSaldos[i] += transferencia
      novosSaldos[j] -= transferencia

      const checkpoint = acertos.length
      acertos.push({ 
        de: ids[i], 
        para: ids[j], 
        valor: Dinheiro.deCentavos(transferencia) 
      })

      // NOTA TÉCNICA: Em um sistema matematicamente balanceado (soma = 0), 
      // o sucesso é garantido na primeira exploração. O backtracking abaixo 
      // atua como uma salvaguarda de integridade (Defense-in-Depth).
      if (this._resolverAcertos(novosSaldos, ids, acertos)) return true

      // ✅ Backtrack Real: Se este caminho falhou em resolver o grupo todo, 
      // limpa os acertos tentados e tenta o próximo credor
      acertos.splice(checkpoint)
    }

    return false // Não foi possível resolver o grupo a partir deste estado
  }

  static obterExtratoMembro(membroId: string, transacoes: Transacao[]): ItemExtrato[] {
    const transacoesOrdenadas = [...transacoes].sort((a, b) => a.data.getTime() - b.data.getTime())
    
    let saldoAcumulado = Dinheiro.deCentavos(0)
    const extratoCompleto: ItemExtrato[] = []

    for (const t of transacoesOrdenadas) {
      const centavosPagos = t.pagamentos
        .filter(p => p.membro_id === membroId)
        .reduce((acc, p) => acc + p.valor.centavos, 0)
        
      const centavosConsumidos = t.divisoes
        .filter(d => d.beneficiario_id === membroId)
        .reduce((acc, d) => acc + d.valor.centavos, 0)

      const participou = centavosPagos !== 0 || centavosConsumidos !== 0

      const valorPago = Dinheiro.deCentavos(centavosPagos)
      const valorConsumido = Dinheiro.deCentavos(centavosConsumidos)
      const valorLiquido = valorPago.subtrair(valorConsumido)
      
      saldoAcumulado = saldoAcumulado.somar(valorLiquido)
      
      if (participou) {
        extratoCompleto.push({
          id: t.id,
          descricao: t.descricao,
          data: t.data,
          valorPago,
          valorConsumido,
          valorLiquido,
          saldoAcumulado,
          transacao: t
        })
      }
    }

    return extratoCompleto
  }
}
