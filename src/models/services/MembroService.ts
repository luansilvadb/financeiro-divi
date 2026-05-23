import { Membro } from '../entities/Membro'
import type { IMembroRepository } from '../repositories/IMembroRepository'
import type { ICartaoRepository } from '../repositories/ICartaoRepository'
import type { IGastoRepository } from '../repositories/IGastoRepository'
import type { IFaturaRepository } from '../repositories/IFaturaRepository'
import type { IAcertoMembroRepository } from '../repositories/IAcertoMembroRepository'
import type { IMembroService } from './IMembroService'
import { calcularSaldosUnificados } from './NettingService'

export class MembroService implements IMembroService {
  constructor(
    private repository: IMembroRepository,
    private cartaoRepo?: ICartaoRepository,
    private gastoRepo?: IGastoRepository,
    private faturaRepo?: IFaturaRepository,
    private acertoRepo?: IAcertoMembroRepository
  ) {}

  async adicionarMembro(nome: string): Promise<Membro> {
    const novo = new Membro({ id: crypto.randomUUID(), nome, ativo: true })
    await this.repository.salvar(novo)
    return novo
  }

  async desativarMembro(id: string, periodoCorrente?: { mes: number; ano: number }): Promise<void> {
    const membro = await this.repository.buscarPorId(id)
    if (!membro) throw new Error('Membro não encontrado')

    // 1. Responsável padrão por qualquer cartão ativo
    if (this.cartaoRepo) {
      const cartoes = await this.cartaoRepo.listarTodos()
      const ehResponsavel = cartoes.some(c => c.responsavelPadraoId === id)
      if (ehResponsavel) {
        throw new Error('Não é possível desativar um morador que é responsável por um cartão.')
      }
    }

    // 2. Participante de parcelamento ativo com parcelas pendentes futuras
    if (this.gastoRepo && this.faturaRepo) {
      const faturas = await this.faturaRepo.listarTodas()
      const faturasAbertasIds = faturas.filter(f => f.status === 'ABERTA').map(f => f.id)
      
      if (faturasAbertasIds.length > 0) {
        const gastos = await this.gastoRepo.listarTodos()
        const temParcelasFuturas = gastos.some(
          g => g.installments > 1 && 
               faturasAbertasIds.includes(g.faturaId) && 
               (g.compradorId === id || g.divisoes.some(d => d.membroId === id))
        )
        if (temParcelasFuturas) {
          throw new Error('Não é possível desativar um morador participante de parcelamento ativo com parcelas futuras pendentes.')
        }
      }
    }

    // 3. Possua saldo ativo no período corrente diferente de zero (absoluto > 0.005)
    if (periodoCorrente && this.gastoRepo && this.faturaRepo) {
      const faturas = await this.faturaRepo.listarTodas()
      const faturasDoPeriodoIds = faturas
        .filter(f => f.periodo.mes === periodoCorrente.mes && f.periodo.ano === periodoCorrente.ano)
        .map(f => f.id)
      
      const todosGastos = await this.gastoRepo.listarTodos()
      const gastosDoPeriodo = todosGastos.filter(g => faturasDoPeriodoIds.includes(g.faturaId))
      
      const membros = await this.repository.listarTodos()
      const saldos = calcularSaldosUnificados(membros, gastosDoPeriodo)
      
      const saldoMembro = saldos[id] || 0
      if (Math.abs(saldoMembro) > 0.005) {
        throw new Error('Não é possível desativar um morador com saldo ativo diferente de zero no período atual.')
      }
    }

    if (this.acertoRepo) {
      const todosAcertos = await this.acertoRepo.listarTodos()
      const possuiAcertosPendentes = todosAcertos.some(a => a.membroId === id && !a.pago)
      if (possuiAcertosPendentes) {
        throw new Error('Não é possível desativar um morador com acertos pendentes de faturas anteriores.')
      }
    }

    const atualizado = new Membro({
      id: membro.id,
      nome: membro.nome,
      ativo: false,
      dataCriacao: membro.dataCriacao
    })
    await this.repository.salvar(atualizado)
  }

  async ativarMembro(id: string): Promise<void> {
    const membro = await this.repository.buscarPorId(id)
    if (!membro) throw new Error('Membro não encontrado')
    const atualizado = new Membro({
      id: membro.id,
      nome: membro.nome,
      ativo: true,
      dataCriacao: membro.dataCriacao
    })
    await this.repository.salvar(atualizado)
  }
}
