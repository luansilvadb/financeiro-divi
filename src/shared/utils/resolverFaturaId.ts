import type { Fatura } from '../../models/entities/Fatura'
import type { Gasto } from '../../models/entities/Gasto'
import type { IFaturaRepository } from '../../models/repositories/IFaturaRepository'

// ── Pure helpers ──

/** Constrói um Map de chave composta (cartaoId-mes-ano) → ID real da fatura. */
function construirMapaFaturaIds(faturas: Fatura[]): Map<string, string> {
  const mapa = new Map<string, string>()
  for (const f of faturas) {
    mapa.set(`${f.cartaoId}-${f.periodo.mes}-${f.periodo.ano}`, f.id)
  }
  return mapa
}

/** Padrão para IDs compostos: <uuid>-<mes>-<ano> (3 segmentos, os dois últimos numéricos). */
const COMPOSITO_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-\d{1,2}-\d{4}$/

function isIdCompostoValido(id: string): boolean {
  return COMPOSITO_REGEX.test(id)
}

/** Substitui IDs compostos nos gastos usando o mapa de chaves → IDs reais. */
function substituirIdsCompostos(
  gastos: Gasto[],
  mapa: Map<string, string>,
  detector: (id: string) => boolean = isIdCompostoValido,
): void {
  for (const g of gastos) {
    if (g.faturaId && detector(g.faturaId)) {
      const realId = mapa.get(g.faturaId)
      if (realId) {
        ;(g as { faturaId: string | null }).faturaId = realId
      }
    }
  }
}

// ── Public API ──

/**
 * Substitui IDs compostos de fatura (cartaoId-mes-ano) pelos UUIDs reais
 * gerados pelo backend após a persistência, em todos os gastos fornecidos.
 *
 * Mutação in-place nos objetos Gasto passados.
 * Versão assíncrona: busca faturas do repositório.
 */
export async function resolverIdsReaisDeFatura(
  gastos: Gasto[],
  faturaRepo: IFaturaRepository,
): Promise<void> {
  if (gastos.length === 0) return
  const faturas = await faturaRepo.listarTodas()
  substituirIdsCompostos(gastos, construirMapaFaturaIds(faturas))
}

/**
 * Versão síncrona usada quando as faturas já estão carregadas em memória.
 * Aceita um detector customizado que verifica via split simples (>= 3 segmentos)
 * em vez do regex completo, para compatibilidade com o LancamentoService.
 */
export function resolverIdsPorSplit(
  gastos: Gasto[],
  faturas: Fatura[],
): void {
  const detector = (id: string) => id.split('-').length >= 3
  substituirIdsCompostos(gastos, construirMapaFaturaIds(faturas), detector)
}
