import type { IFaturaRepository } from '../IFaturaRepository'
import type { IGastoRepository } from '../IGastoRepository'
import { Fatura } from '../../entities/Fatura'
import type { FaturaPeriodo } from '../../entities/Fatura'
import { StorageLock } from '../../../shared/utils/StorageLock'
import { LocalStorageGastoRepository } from './LocalStorageGastoRepository'
import { Gasto } from '../../entities/Gasto'

export class LocalStorageFaturaRepository implements IFaturaRepository {
  private readonly STORAGE_KEY = 'divi_faturas'

  constructor(private gastoRepo?: IGastoRepository) {}

  async salvar(fatura: Fatura): Promise<void> {
    await StorageLock.executarAtomico('lock_divi_faturas', async () => {
      const todas = this.listarTodasInternal()
      const index = todas.findIndex(f => f.id === fatura.id)
      if (index >= 0) {
        todas[index] = fatura
      } else {
        const dupIdx = todas.findIndex(f => f.cartaoId === fatura.cartaoId && f.periodo.mes === fatura.periodo.mes && f.periodo.ano === fatura.periodo.ano)
        if (dupIdx >= 0) {
          todas[dupIdx] = fatura
        } else {
          todas.push(fatura)
        }
      }
      this.salvarListaFaturasFisicamente(todas)
    })
  }

  async salvarMuitas(faturas: Fatura[]): Promise<void> {
    await StorageLock.executarAtomico('lock_divi_faturas', async () => {
      const todas = this.listarTodasInternal()
      for (const fatura of faturas) {
        const index = todas.findIndex(f => f.id === fatura.id)
        if (index >= 0) {
          todas[index] = fatura
        } else {
          const dupIdx = todas.findIndex(f => f.cartaoId === fatura.cartaoId && f.periodo.mes === fatura.periodo.mes && f.periodo.ano === fatura.periodo.ano)
          if (dupIdx >= 0) {
            todas[dupIdx] = fatura
          } else {
            todas.push(fatura)
          }
        }
      }
      this.salvarListaFaturasFisicamente(todas)
    })
  }

  async buscarPorId(id: string): Promise<Fatura | null> {
    const todas = await this.listarTodas()
    return todas.find(f => f.id === id) || null
  }

  async buscarPorCartaoEPeriodo(cartaoId: string, periodo: FaturaPeriodo): Promise<Fatura | null> {
    const todas = await this.listarTodas()
    return todas.find(f => f.cartaoId === cartaoId && f.periodo.mes === periodo.mes && f.periodo.ano === periodo.ano) || null
  }

  async listarTodas(): Promise<Fatura[]> {
    return await StorageLock.executarAtomico('lock_divi_faturas', async () => {
      return this.listarTodasInternal()
    })
  }

  private listarTodasInternal(): Fatura[] {
    const data = localStorage.getItem(this.STORAGE_KEY)
    if (!data) return []
    try {
      const raw = JSON.parse(data) as any[]
      return raw.map(f => new Fatura({
        ...f,
        dataPagamentoBanco: f.dataPagamentoBanco ? new Date(f.dataPagamentoBanco) : undefined
      }))
    } catch (e) {
      console.error('Erro grave de integridade no banco de dados local de faturas:', e)
      throw new Error('Banco de dados local de faturas corrompido. Operação abortada para evitar perda de dados.')
    }
  }

  async executarMigracoesEDesduplicacao(): Promise<void> {
    await StorageLock.executarAtomico('lock_divi_faturas_migration', async () => {
      const faturas = this.listarTodasInternal()
      if (faturas.length === 0) return
      await this.desduplicarEMigrarFaturas(faturas)
    })
  }

  private salvarListaFaturasFisicamente(faturas: Fatura[]): void {
    const dtos = faturas.map(f => ({
      id: f.id,
      cartaoId: f.cartaoId,
      periodo: f.periodo,
      responsavelId: f.responsavelId,
      status: f.status,
      dataPagamentoBanco: f.dataPagamentoBanco ? f.dataPagamentoBanco.toISOString() : undefined
    }))
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dtos))
  }

  private async desduplicarEMigrarFaturas(todasFaturas: Fatura[]): Promise<Fatura[]> {
    let maisRecenteAno = 0
    let maisRecenteMes = 0
    for (const f of todasFaturas) {
      if (f.status === 'ABERTA') {
        if (f.periodo.ano > maisRecenteAno || (f.periodo.ano === maisRecenteAno && f.periodo.mes > maisRecenteMes)) {
          maisRecenteAno = f.periodo.ano
          maisRecenteMes = f.periodo.mes
        }
      }
    }

    if (maisRecenteAno === 0) {
      const hoje = new Date()
      maisRecenteMes = hoje.getMonth() + 1
      maisRecenteAno = hoje.getFullYear()
    }

    const faturasUnicas = new Map<string, Fatura>()
    const faturasParaRemover: Fatura[] = []
    
    for (const f of todasFaturas) {
      const chave = `${f.cartaoId}-${f.periodo.mes}-${f.periodo.ano}`
      const existente = faturasUnicas.get(chave)
      if (existente) {
        const isPassado = f.periodo.ano < maisRecenteAno || (f.periodo.ano === maisRecenteAno && f.periodo.mes < maisRecenteMes)
        
        let manter = existente
        let remover = f
        
        if (!isPassado) {
          if (f.status === 'ABERTA' && existente.status !== 'ABERTA') {
            manter = f
            remover = existente
          }
        } else {
          if (f.status !== 'ABERTA' && existente.status === 'ABERTA') {
            manter = f
            remover = existente
          }
        }
        
        faturasUnicas.set(chave, manter)
        faturasParaRemover.push(remover)
      } else {
        faturasUnicas.set(chave, f)
      }
    }

    if (faturasParaRemover.length > 0) {
      console.warn(`[Divi Migration] Detectadas ${faturasParaRemover.length} faturas duplicadas. Iniciando migração...`)
      const gastoRepo = this.gastoRepo || new LocalStorageGastoRepository()
      const todosGastos = await gastoRepo.listarTodos()
      
      for (const fRem of faturasParaRemover) {
        const chave = `${fRem.cartaoId}-${fRem.periodo.mes}-${fRem.periodo.ano}`
        const fMant = faturasUnicas.get(chave)!
        
        const gastosMigrar = todosGastos.filter(g => g.faturaId === fRem.id)
        for (const g of gastosMigrar) {
          const novoGasto = new Gasto({
            id: g.id,
            faturaId: fMant.id,
            descricao: g.descricao,
            valorTotal: g.valorTotal,
            compradorId: g.compradorId,
            divisoes: g.divisoes,
            installments: g.installments,
            totalInstallments: g.totalInstallments,
            isLoan: g.isLoan,
            borrowerId: g.borrowerId,
            recurringBillId: g.recurringBillId,
            isSettlement: g.isSettlement,
            settlementDetails: g.settlementDetails,
            method: g.method,
            cardOwner: g.cardOwner,
            grupoParcelasId: g.grupoParcelasId
          })
          await gastoRepo.salvar(novoGasto)
        }
      }
      
      const listaLimpa = Array.from(faturasUnicas.values())
      this.salvarListaFaturasFisicamente(listaLimpa)
      return listaLimpa
    }

    return todasFaturas
  }
}
