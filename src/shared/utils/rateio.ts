export interface MembroComRenda {
  id: string
  nome?: string
  rendaCentavos?: number
}

export function obterMembrosSelecionadosSemRenda<T extends MembroComRenda>(
  membros: T[],
  participantesIds: string[],
): T[] {
  return membros.filter(membro =>
    participantesIds.includes(membro.id) &&
    (!membro.rendaCentavos || Number(membro.rendaCentavos) <= 0),
  )
}

export function calcularRateioProporcionalCentavos(
  totalCentavos: number,
  participantes: Array<{ id: string; rendaCentavos: number }>,
): Record<string, number> {
  if (
    !Number.isInteger(totalCentavos) ||
    totalCentavos < 0 ||
    participantes.length === 0 ||
    participantes.some(participante => !Number.isFinite(participante.rendaCentavos) || participante.rendaCentavos <= 0)
  ) {
    throw new Error('Rateio proporcional requer valor em centavos e rendas positivas.')
  }

  // Deduplicate participants by ID (last occurrence wins).
  const seen = new Set<string>()
  const unique = participantes.filter(p => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
  if (unique.length !== participantes.length) {
    participantes = unique
  }

  const somaRendas = participantes.reduce((total, participante) => total + participante.rendaCentavos, 0)
  const valores: Record<string, number> = {}
  let restante = totalCentavos

  for (const participante of participantes) {
    const valor = Math.floor(totalCentavos * (participante.rendaCentavos / somaRendas))
    valores[participante.id] = valor
    restante -= valor
  }

  const ordemDoResto = [...participantes].sort((a, b) =>
    b.rendaCentavos - a.rendaCentavos || a.id.localeCompare(b.id),
  )
  for (let indice = 0; restante > 0; indice++, restante--) {
    valores[ordemDoResto[indice % ordemDoResto.length].id]++
  }

  return valores
}
