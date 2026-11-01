import { describe, expect, it } from 'vitest';
import type { IDatabaseService } from '../../../core/ports/IDatabaseService';
import type { Transaction } from '../../../core/domain/Transaction';
import type { OtherLedger, OtherLedgerEntry } from '../../domain/types';
import { OtherLedgerService } from '../OtherLedgerService';

const LEDGER = 'led-1';

function entry(id: string, date: string, credit: number, debit: number, balance: number): OtherLedgerEntry {
  return {
    id, ledgerId: LEDGER, date, description: id, debit, credit, balance,
    metadata: {}, createdAt: `${date}T00:00:00.000Z`, updatedAt: `${date}T00:00:00.000Z`,
  };
}

function tx(id: string, amount: number, date = '2026-01-15'): Transaction {
  return { id, type: 'expense', description: `Tx ${id}`, amount, memberId: 'm1', date: `${date}T10:00:00.000Z` } as Transaction;
}

class FakeDb {
  entries: OtherLedgerEntry[];
  saves: OtherLedgerEntry[] = [];
  dualWrites: { tx: Transaction; entry: OtherLedgerEntry }[] = [];
  throwOnDualWrite = false;
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
  async getOtherLedgerEntryById(id: string): Promise<OtherLedgerEntry | null> {
    const found = this.entries.find((x) => x.id === id);
    return found ? { ...found } : null;
  }
  async saveOtherLedgerEntry(e: OtherLedgerEntry): Promise<void> {
    this.saves.push({ ...e });
    const i = this.entries.findIndex((x) => x.id === e.id);
    if (i >= 0) this.entries[i] = { ...e };
    else this.entries.push({ ...e });
  }
  async saveTransactionWithLedgerEntry(t: Transaction, entry: OtherLedgerEntry): Promise<void> {
    if (this.throwOnDualWrite) throw new Error('disk full');
    this.dualWrites.push({ tx: t, entry: { ...entry } });
    await this.saveOtherLedgerEntry(entry);
  }
}

function makeService(entries: OtherLedgerEntry[]) {
  const db = new FakeDb(entries);
  return { service: new OtherLedgerService(db as unknown as IDatabaseService), db };
}

describe('OtherLedgerService.createLinkedEntryFromTransaction', () => {
  it('writes entry + transaction together and stamps the link', async () => {
    const { service, db } = makeService([
      entry('a', '2026-01-01', 100, 0, 1100),
    ]);
    const t = tx('t-1', 15000);

    const saved = await service.createLinkedEntryFromTransaction({ tx: t, ledgerId: LEDGER, side: 'credit' });

    expect(db.dualWrites).toHaveLength(1);
    expect(db.dualWrites[0]!.tx.id).toBe('t-1');
    expect(saved.linkedTransactionId).toBe('t-1');
    expect(saved.credit).toBe(15000);
    expect(saved.debit).toBe(0);
    expect(saved.date).toBe('2026-01-15');
    // appended after a(1100): 1100 + 15000
    expect(saved.balance).toBe(16100);
  });

  it('a debit side posts a debit row', async () => {
    const { service, db } = makeService([]);
    const saved = await service.createLinkedEntryFromTransaction({ tx: tx('t-2', 500), ledgerId: LEDGER, side: 'debit' });
    expect(saved.debit).toBe(500);
    expect(saved.credit).toBe(0);
    expect(saved.balance).toBe(1000 - 500);
    expect(db.dualWrites).toHaveLength(1);
  });

  it('refuses dates before the ledger starting date and writes nothing', async () => {
    const { service, db } = makeService([]);
    await expect(
      service.createLinkedEntryFromTransaction({ tx: tx('t-3', 10, '2025-12-31'), ledgerId: LEDGER, side: 'credit' }),
    ).rejects.toThrow(/before ledger starting date/);
    expect(db.dualWrites).toHaveLength(0);
  });

  it('a failed dual-write leaves no linked entry behind', async () => {
    const { service, db } = makeService([]);
    db.throwOnDualWrite = true;
    await expect(
      service.createLinkedEntryFromTransaction({ tx: tx('t-4', 10), ledgerId: LEDGER, side: 'credit' }),
    ).rejects.toThrow('disk full');
    expect(db.entries).toHaveLength(0);
  });
});
