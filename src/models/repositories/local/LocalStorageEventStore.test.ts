import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageEventStore } from './LocalStorageEventStore';

describe('LocalStorageEventStore', () => {
  let store: LocalStorageEventStore;

  beforeEach(() => {
    localStorage.clear();
    store = new LocalStorageEventStore();
  });

  it('should append and retrieve events', async () => {
    const event = { id: '1', type: 'GASTO_LANCADO', timestamp: Date.now(), version: 1, payload: {} };
    await store.append([event as any]);
    const stream = await store.getStream();
    expect(stream).toHaveLength(1);
    expect(stream[0].id).toBe('1');
  });
});
