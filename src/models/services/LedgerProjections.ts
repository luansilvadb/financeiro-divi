import { LedgerEvent } from '../entities/LedgerEvent';

export class LedgerProjections {
  static computeSaldos(events: LedgerEvent[]): Record<string, number> {
    const saldos: Record<string, number> = {};
    
    events.forEach(event => {
      if (event.type === 'GASTO_LANCADO') {
        const { compradorId, valorCentavos, divisoes } = event.payload;
        saldos[compradorId] = (saldos[compradorId] || 0) + valorCentavos;
        divisoes.forEach((d: any) => {
          saldos[d.membroId] = (saldos[d.membroId] || 0) - d.valorCentavos;
        });
      }
    });
    
    return saldos;
  }
}
