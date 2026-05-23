import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LedgerService } from './LedgerService';
import type { IEventStore } from '../repositories/IEventStore';
import type { LedgerEvent, GastoLancadoPayload } from '../entities/LedgerEvent';

describe('LedgerService', () => {
  let store: IEventStore;
  let service: LedgerService;

  beforeEach(() => {
    store = {
      append: vi.fn(),
      getStream: vi.fn().mockResolvedValue([]),
      clear: vi.fn()
    };
    service = new LedgerService(store);
  });

  it('should append a GASTO_LANCADO event when lancarGasto is called', async () => {
    const payload: GastoLancadoPayload = {
      id: 'g1',
      faturaId: 'f1',
      compradorId: 'm1',
      valorCentavos: 1000,
      divisoes: [{ membroId: 'm2', valorCentavos: 1000 }],
      descricao: 'test',
      paymentMethod: 'pix'
    };

    await service.lancarGasto(payload);

    expect(store.getStream).toHaveBeenCalled();
    expect(store.append).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        type: 'GASTO_LANCADO',
        payload
      })
    ]));
  });

  it('should increment version correctly', async () => {
    const existingEvent: LedgerEvent = {
      id: 'e1',
      type: 'GASTO_LANCADO',
      timestamp: Date.now(),
      version: 1,
      payload: {} as any
    };
    (store.getStream as any).mockResolvedValue([existingEvent]);

    const payload: GastoLancadoPayload = {
      id: 'g2',
      faturaId: 'f1',
      compradorId: 'm1',
      valorCentavos: 500,
      divisoes: [],
      descricao: 'test 2',
      paymentMethod: 'card'
    };

    await service.lancarGasto(payload);

    expect(store.append).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        version: 2
      })
    ]));
  });
});
