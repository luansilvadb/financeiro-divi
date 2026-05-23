import type { IEventStore } from '../repositories/IEventStore';
import { LedgerAggregate } from '../entities/LedgerAggregate';
import type { LedgerEvent, GastoLancadoPayload } from '../entities/LedgerEvent';

export class LedgerService {
  constructor(private eventStore: IEventStore) {}

  async lancarGasto(payload: GastoLancadoPayload): Promise<void> {
    const events = await this.eventStore.getStream();
    const aggregate = LedgerAggregate.rebuild(events);
    
    aggregate.validateLancarGasto(payload.faturaId);
    
    const event: LedgerEvent = {
      id: crypto.randomUUID(),
      type: 'GASTO_LANCADO',
      timestamp: Date.now(),
      version: events.length + 1,
      payload
    };
    
    await this.eventStore.append([event]);
  }
}
