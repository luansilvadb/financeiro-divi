import type { IEventStore } from '../repositories/IEventStore';
import type { IGastoRepository } from '../repositories/IGastoRepository';
import type { LedgerEvent } from '../entities/LedgerEvent';

export class BootstrapEventGenerator {
  constructor(
    private eventStore: IEventStore,
    private gastoRepo: IGastoRepository
  ) {}

  async migrate(): Promise<void> {
    const existingEvents = await this.eventStore.getStream();
    if (existingEvents.length > 0) return; // Already migrated

    const gastos = await this.gastoRepo.listarTodos();
    const migrationEvents: LedgerEvent[] = [];

    migrationEvents.push({
      id: crypto.randomUUID(),
      type: 'MIGRACAO_ESTADO_INICIAL' as const,
      timestamp: Date.now(),
      version: 0,
      payload: {}
    });

    const gastoEvents = gastos.map(g => ({
      id: crypto.randomUUID(),
      type: 'GASTO_LANCADO' as const,
      timestamp: Date.now(),
      version: 0,
      payload: {
        id: g.id,
        faturaId: g.faturaId,
        compradorId: g.compradorId,
        valorCentavos: g.valorTotal.centavos,
        divisoes: g.divisoes.map(d => ({ membroId: d.membroId, valorCentavos: d.valor.centavos })),
        descricao: g.descricao,
        paymentMethod: g.method || 'card',
        cardOwnerId: g.cardOwner
      }
    }));

    migrationEvents.push(...gastoEvents);

    if (migrationEvents.length > 0) {
      await this.eventStore.append(migrationEvents);
    }
  }
}
