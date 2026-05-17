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
      result.set(id, Dinheiro.deCentavos(centavos))
    }

    return result
  }

  static calcularAcertos(saldos: Map<string, Dinheiro>): Acerto[] {
    const acertos: Acerto[] = []
    const devedores: { id: string; saldo: number }[] = []
    const credores: { id: string; saldo: number }[] = []

    for (const [id, saldo] of saldos.entries()) {
      if (saldo.centavos < 0) {
        devedores.push({ id, saldo: Math.abs(saldo.centavos) })
      } else if (saldo.centavos > 0) {
        credores.push({ id, saldo: saldo.centavos })
      }
    }

    // Sort to optimize (highest amounts first)
    devedores.sort((a, b) => b.saldo - a.saldo)
    credores.sort((a, b) => b.saldo - a.saldo)

    let i = 0, j = 0
    while (i < devedores.length && j < credores.length) {
      const devedor = devedores[i]
      const credor = credores[j]
      const valorTransferencia = Math.min(devedor.saldo, credor.saldo)

      if (valorTransferencia > 0) {
        acertos.push({
          de: devedor.id,
          para: credor.id,
          valor: Dinheiro.deCentavos(valorTransferencia)
        })
      }

      devedor.saldo -= valorTransferencia
      credor.saldo -= valorTransferencia

      if (devedor.saldo === 0) i++
      if (credor.saldo === 0) j++
    }

    // Verificação de integridade: a soma dos saldos residuais deve ser zero
    const saldoResidual = devedores.reduce((acc, d) => acc + d.saldo, 0) + 
                          credores.reduce((acc, c) => acc + c.saldo, 0)
    
    if (saldoResidual > 0) {
      // Isso indica que o input 'saldos' não somava zero (erro em algum lugar do fluxo de dados)
      console.error('Saldos desbalanceados detectados:', { devedores, credores, saldoResidual })
      throw new Error('Erro de integridade: Os saldos informados para o acerto de contas não estão balanceados.')
    }

    return acertos
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
