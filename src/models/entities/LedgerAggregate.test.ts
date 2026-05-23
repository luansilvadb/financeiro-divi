import { describe, it, expect } from 'vitest';
import { LedgerAggregate } from './LedgerAggregate';

describe('LedgerAggregate', () => {
  it('should reject Gasto if fatura is closed', () => {
    const aggregate = new LedgerAggregate();
    // Simulate closed fatura by applying event
    aggregate.apply({ type: 'FATURA_FECHADA', payload: { faturaId: 'f1' } } as any);
    
    expect(() => aggregate.validateLancarGasto('f1')).toThrow('Fatura trancada');
  });

  it('should rebuild state from events', () => {
    const events = [
      { type: 'FATURA_FECHADA', payload: { faturaId: 'f1' } }
    ];
    
    const aggregate = LedgerAggregate.rebuild(events as any);
    expect(() => aggregate.validateLancarGasto('f1')).toThrow('Fatura trancada');
    expect(() => aggregate.validateLancarGasto('f2')).not.toThrow();
  });
});
