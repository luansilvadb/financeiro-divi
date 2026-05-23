import { describe, it, expect, vi } from 'vitest';
import { BootstrapEventGenerator } from './BootstrapEventGenerator';
import type { IEventStore } from '../repositories/IEventStore';
import type { IGastoRepository } from '../repositories/IGastoRepository';
import { Gasto } from '../entities/Gasto';
import { Dinheiro } from '../entities/Dinheiro';
import { DivisaoDeGasto } from '../entities/DivisaoDeGasto';

describe('BootstrapEventGenerator', () => {
  it('should not migrate if events already exist', async () => {
    const eventStore = {
      getStream: vi.fn().mockResolvedValue([{ id: '1' }]),
      append: vi.fn(),
      clear: vi.fn(),
    } as unknown as IEventStore;

    const gastoRepo = {
      listarTodos: vi.fn(),
    } as unknown as IGastoRepository;

    const generator = new BootstrapEventGenerator(eventStore, gastoRepo);
    await generator.migrate();

    expect(gastoRepo.listarTodos).not.toHaveBeenCalled();
    expect(eventStore.append).not.toHaveBeenCalled();
  });

  it('should migrate gastos to events if event store is empty', async () => {
    const eventStore = {
      getStream: vi.fn().mockResolvedValue([]),
      append: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn(),
    } as unknown as IEventStore;

    const mockGasto = new Gasto({
      id: 'gasto-1',
      faturaId: 'fatura-1',
      descricao: 'Teste',
      valorTotal: Dinheiro.deCentavos(1000),
      compradorId: 'membro-1',
      method: 'card',
      divisoes: [
        new DivisaoDeGasto('membro-1', Dinheiro.deCentavos(1000))
      ]
    });

    const gastoRepo = {
      listarTodos: vi.fn().mockResolvedValue([mockGasto]),
    } as unknown as IGastoRepository;

    const generator = new BootstrapEventGenerator(eventStore, gastoRepo);
    await generator.migrate();

    expect(eventStore.append).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        type: 'MIGRACAO_ESTADO_INICIAL',
      }),
      expect.objectContaining({
        type: 'GASTO_LANCADO',
        payload: expect.objectContaining({
          id: 'gasto-1',
          valorCentavos: 1000,
          cardOwnerId: null
        })
      })
    ]));
  });

  it('should include cardOwnerId in payload if present', async () => {
    const eventStore = {
      getStream: vi.fn().mockResolvedValue([]),
      append: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn(),
    } as unknown as IEventStore;

    const mockGasto = new Gasto({
      id: 'gasto-1',
      faturaId: 'fatura-1',
      descricao: 'Teste',
      valorTotal: Dinheiro.deCentavos(1000),
      compradorId: 'membro-1',
      method: 'card',
      cardOwner: 'membro-2',
      divisoes: [
        new DivisaoDeGasto('membro-1', Dinheiro.deCentavos(1000))
      ]
    });

    const gastoRepo = {
      listarTodos: vi.fn().mockResolvedValue([mockGasto]),
    } as unknown as IGastoRepository;

    const generator = new BootstrapEventGenerator(eventStore, gastoRepo);
    await generator.migrate();

    expect(eventStore.append).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        payload: expect.objectContaining({
          cardOwnerId: 'membro-2'
        })
      })
    ]));
  });
});
