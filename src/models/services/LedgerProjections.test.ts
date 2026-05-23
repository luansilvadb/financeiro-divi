import { describe, it, expect } from 'vitest';
import { LedgerProjections } from './LedgerProjections';

describe('LedgerProjections', () => {
  it('should compute balances from GastoLancado events', () => {
    const events = [{
      type: 'GASTO_LANCADO',
      payload: { 
        valorCentavos: 1000, 
        compradorId: 'm1', 
        divisoes: [{ membroId: 'm2', valorCentavos: 1000 }] 
      }
    }];
    const saldos = LedgerProjections.computeSaldos(events as any);
    expect(saldos['m1']).toBe(1000); // m1 lent 1000
    expect(saldos['m2']).toBe(-1000); // m2 owes 1000
  });
});
