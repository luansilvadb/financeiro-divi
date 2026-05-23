import { LedgerEvent } from '../entities/LedgerEvent';

export interface IEventStore {
  append(events: LedgerEvent[]): Promise<void>;
  getStream(): Promise<LedgerEvent[]>;
  clear(): Promise<void>;
}
