import { describe, expect, it } from 'vitest';
import type { IDatabaseService } from '../../../core/ports/IDatabaseService';
import type { Transaction } from '../../../core/domain/Transaction';
import type { OtherLedger, OtherLedgerEntry } from '../../domain/types';
import { OtherLedgerService } from '../OtherLedgerService';

const LEDGER = 'led-1';

function entry(id: string, date: string, credit: number, debit: number, balance: number, linkedTransactionId?: string): OtherLedgerEntry {
  return {
    id, ledgerId: LEDGER, date, description: id, debit, credit, balance,
    linkedTransactionId, metadata: {},
    createdAt: `${date}T00:00:00.000Z`, updatedAt: `${date}T00:00:00.000Z`,
  };
}

function tx(id: string, amount: number, date = '2026-01-20', description = `Tx ${id}`): Transaction {
  return { id, type: 'expense', description, amount, memberId: 'm1', date: `${date}T10:00:00.000Z` } as Transaction;
}

class FakeDb {
  entries: OtherLedgerEntry[];
  transactions: Transaction[] = [tx('t-1', 500), tx('t-2', 900)];
  updates: OtherLedgerEntry[] = [];
  ledger: OtherLedger = {
    id: LEDGER, name: 'House Rent', ownerType: 'external', ownerName: 'Landlord',
    startingDate: '2026-01-01', openingBalance: 0,
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
  async getOtherLedgerEntryByTransactionId(txId: string): Promise<OtherLedgerEntry | null> {
    const found = this.entries.find((x) => x.linkedTransactionId === txId && !x.deletedAt);
    return found ? { ...found } : null;
  }
  async getTransactionById(id: string): Promise<Transaction | null> {
    const found = this.transactions.find((t) => t.id === id);
    return found ? { ...found } : null;
  }
  async updateOtherLedgerEntry(id: string, entry: OtherLedgerEntry): Promise<void> {
    this.updates.push({ ...entry });
    const i = this.entries.findIndex((x) => x.id === id);
    if (i >= 0) this.entries[i] = { ...entry };
    else this.entries.push({ ...entry });
  }
  async saveOtherLedgerEntry(entry: OtherLedgerEntry): Promise<void> {
    await this.updateOtherLedgerEntry(entry.id, entry);
  }
}

function makeService(entries: OtherLedgerEntry[]) {
  const db = new FakeDb(entries);
  return { service: new OtherLedgerService(db as unknown as IDatabaseService), db };
}

describe('OtherLedgerService.syncLinkedEntryAfterTransactionUpdate', () => {
  it("'linked' rewrites date/description/amount on the entry's original side", async () => {
    // Entry was posted as credit (the side chosen at dual-post time).
    const { service, db } = makeService([entry('e1', '2026-01-10', 500, 0, 500, 't-1')]);

    const touched = await service.syncLinkedEntryAfterTransactionUpdate(tx('t-1', 900, '2026-01-25', 'Rent July'), 'linked');

    expect(touched).toEqual({ ledgerId: LEDGER });
    const next = db.entries[0]!;
    expect(next.credit).toBe(900);
    expect(next.debit).toBe(0);
    expect(next.date).toBe('2026-01-25');
    expect(next.description).toBe('Rent July');
    expect(next.linkedTransactionId).toBe('t-1');
  });

  it("'unlink' cuts the link but keeps the amounts", async () => {
    const { service, db } = makeService([entry('e1', '2026-01-10', 500, 0, 500, 't-1')]);

    const touched = await service.syncLinkedEntryAfterTransactionUpdate(tx('t-1', 900), 'unlink');

    expect(touched).toEqual({ ledgerId: LEDGER });
    const next = db.entries[0]!;
    expect(next.linkedTransactionId).toBeUndefined();
    expect(next.credit).toBe(500);
  });

  it("'linked' refuses a date moved before the ledger's starting window", async () => {
    const { service, db } = makeService([entry('e1', '2026-01-10', 500, 0, 500, 't-1')]);

    await expect(
      service.syncLinkedEntryAfterTransactionUpdate(tx('t-1', 900, '2025-12-20'), 'linked'),
    ).rejects.toThrow(/starts on 2026-01-01/);
    expect(db.updates).toHaveLength(0);
  });

  it('returns null when the transaction has no mirror row', async () => {
    const { service, db } = makeService([]);

    const touched = await service.syncLinkedEntryAfterTransactionUpdate(tx('t-1', 100), 'linked');

    expect(touched).toBeNull();
    expect(db.updates).toHaveLength(0);
  });
});

describe('OtherLedgerService one-transaction-one-link', () => {
  it('retro-linking an already-linked transaction is refused', async () => {
    // t-1 already mirrored by e1; linking e2 to t-1 would double count.
    const { service } = makeService([entry('e1', '2026-01-10', 500, 0, 500, 't-1')]);

    await expect(
      service.createEntry({
        ledgerId: LEDGER, date: '2026-01-20', description: 'Other row',
        credit: 900, linkedTransactionId: 't-1',
      }),
    ).rejects.toThrow(/already linked/);
  });
});
