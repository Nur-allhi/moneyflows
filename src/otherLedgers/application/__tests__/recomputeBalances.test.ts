import { describe, expect, it } from 'vitest';
import type { IDatabaseService } from '../../../core/ports/IDatabaseService';
import type { OtherLedger, OtherLedgerEntry } from '../../domain/types';
import { OtherLedgerService } from '../OtherLedgerService';

const LEDGER = 'led-1';

function entry(id: string, date: string, credit: number, debit: number, balance: number): OtherLedgerEntry {
  return {
    id, ledgerId: LEDGER, date, description: id, debit, credit, balance,
    metadata: {}, createdAt: `${date}T00:00:00.000Z`, updatedAt: `${date}T00:00:00.000Z`,
  };
}

class FakeDb {
  entries: OtherLedgerEntry[];
  saves: OtherLedgerEntry[] = [];
  ledger: OtherLedger = {
    id: LEDGER, name: 'Rafiq', ownerType: 'external', ownerName: 'Rafiq',
    startingDate: '2026-01-01', openingBalance: 1000,
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  };
  constructor(entries: OtherLedgerEntry[]) { this.entries = entries; }
  async getOtherLedgerById(id: string): Promise<OtherLedger | null> {
    return id === LEDGER ? { ...this.ledger } : null;
  }
  async getOtherLedgerEntries(id: string): Promise<OtherLedgerEntry[]> {
    return this.entries.filter((e) => e.ledgerId === id && !e.deletedAt).map((e) => ({ ...e }));
  }
  async saveOtherLedgerEntry(e: OtherLedgerEntry): Promise<void> {
    this.saves.push({ ...e });
    const i = this.entries.findIndex((x) => x.id === e.id);
    if (i >= 0) this.entries[i] = { ...e };
  }
}

function makeService(entries: OtherLedgerEntry[]): { service: OtherLedgerService; db: FakeDb } {
  const db = new FakeDb(entries);
  return { service: new OtherLedgerService(db as unknown as IDatabaseService), db };
}

describe('OtherLedgerService.recomputeBalances', () => {
  it('leaves a ledger alone when every balance is already right', async () => {
    const { service, db } = makeService([
      entry('a', '2026-01-01', 100, 0, 1100),
      entry('b', '2026-01-02', 200, 0, 1300),
    ]);

    await service.recomputeBalances(LEDGER);

    expect(db.saves).toEqual([]);
    expect(db.entries.map((e) => e.updatedAt)).toEqual(['2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z']);
  });

  it('writes only the rows whose balance moved, and leaves the rest untouched', async () => {
    const { service, db } = makeService([
      entry('a', '2026-01-01', 100, 0, 1100), // right
      entry('b', '2026-01-02', 200, 0, 1100), // stale: 1100 should be 1300
      entry('c', '2026-01-03', 0, 300, 1000), // right
    ]);

    await service.recomputeBalances(LEDGER);

    expect(db.saves.map((e) => e.id)).toEqual(['b']);
    expect(db.saves[0]!.balance).toBe(1300);
    // Untouched rows keep their original stamp: that churn was the defect
    // (BUG-35) — anything keyed to updated_at saw the whole ledger change when
    // one row was added or edited.
    expect(db.entries.find((e) => e.id === 'a')!.updatedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(db.entries.find((e) => e.id === 'c')!.updatedAt).toBe('2026-01-03T00:00:00.000Z');
  });

  it('restamps a changed row with the same ISO timestamp format as every other write', async () => {
    const { service, db } = makeService([entry('a', '2026-01-01', 100, 0, 0)]);

    await service.recomputeBalances(LEDGER);

    // The old code wrote "YYYY-MM-DD HH:MM:SS" into a column every other path
    // fills with "YYYY-MM-DDTHH:MM:SS.sssZ".
    expect(db.saves[0]!.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('walks the ledger in date order, not insertion order', async () => {
    const { service, db } = makeService([
      entry('c', '2026-01-03', 0, 300, 0),
      entry('a', '2026-01-01', 100, 0, 0),
      entry('b', '2026-01-02', 200, 0, 0),
    ]);

    await service.recomputeBalances(LEDGER);

    expect(Object.fromEntries(db.entries.map((e) => [e.id, e.balance]))).toEqual({ a: 1100, b: 1300, c: 1000 });
  });

  it('is idempotent — a second run writes nothing', async () => {
    const { service, db } = makeService([
      entry('a', '2026-01-01', 100, 0, 0),
      entry('b', '2026-01-02', 200, 0, 0),
    ]);

    await service.recomputeBalances(LEDGER);
    const afterFirst = db.saves.length;
    await service.recomputeBalances(LEDGER);

    expect(afterFirst).toBe(2);
    expect(db.saves.length).toBe(afterFirst);
  });
});
