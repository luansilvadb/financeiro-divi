import type { IEventStore } from '../IEventStore';
import type { LedgerEvent } from '../../entities/LedgerEvent';

export class LocalStorageEventStore implements IEventStore {
  private readonly STORAGE_KEY = 'divi_event_stream';

  async append(events: LedgerEvent[]): Promise<void> {
    const current = await this.getStream();
    const updated = [...current, ...events];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  async getStream(): Promise<LedgerEvent[]> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
