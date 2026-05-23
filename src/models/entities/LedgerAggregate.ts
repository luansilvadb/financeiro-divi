import type { LedgerEvent } from './LedgerEvent';

export class LedgerAggregate {
  private closedFaturas = new Set<string>();

  apply(event: LedgerEvent): void {
    if (event.type === 'FATURA_FECHADA') {
      this.closedFaturas.add(event.payload.faturaId);
    }
  }

  validateLancarGasto(faturaId: string): void {
    if (this.closedFaturas.has(faturaId)) {
      throw new Error('Fatura trancada para novos lançamentos');
    }
  }

  static rebuild(events: LedgerEvent[]): LedgerAggregate {
    const aggregate = new LedgerAggregate();
    events.forEach(e => aggregate.apply(e));
    return aggregate;
  }
}
