import { v4 as uuidv4 } from 'uuid';
import type { IDatabaseService } from '../../core/ports/IDatabaseService';
import type { OtherLedger, OtherLedgerEntry } from '../domain/types';

function nowIso(): string {
  return new Date().toISOString();
}
function nowSql(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

export function sortOtherEntries(entries: OtherLedgerEntry[]): OtherLedgerEntry[] {
  return [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function computeOtherRunningBalances(
  entries: OtherLedgerEntry[],
  openingBalance: number,
): Map<string, number> {
  const sorted = sortOtherEntries(entries);
  const map = new Map<string, number>();
  let running = openingBalance;
  for (const e of sorted) {
    running += e.credit - e.debit;
    map.set(e.id, running);
  }
  return map;
}

export class OtherLedgerService {
  private db: IDatabaseService;
  constructor(db: IDatabaseService) {
    this.db = db;
  }

  async getLedgers(): Promise<OtherLedger[]> {
    return this.db.getOtherLedgers();
  }

  async getLedgerById(id: string): Promise<OtherLedger | null> {
    return this.db.getOtherLedgerById(id);
  }

  async createLedger(params: {
    name: string;
    startingDate: string;
    ownerType: 'member' | 'external';
    ownerMemberId?: string;
    ownerName?: string;
    openingBalance?: number;
  }): Promise<OtherLedger> {
    const name = params.name.trim();
    if (name.length < 3 || name.length > 50) throw new Error('Ledger name must be 3–50 characters');
    if (!params.startingDate || isNaN(Date.parse(params.startingDate))) throw new Error('Valid starting date is required');
    if (params.ownerType === 'member' && !params.ownerMemberId) throw new Error('Member owner is required');
    if (params.ownerType === 'external' && !params.ownerName?.trim()) throw new Error('Owner name is required');
    if (params.ownerType === 'member' && params.ownerMemberId) {
      const m = await this.db.getMemberById(params.ownerMemberId);
      if (!m) throw new Error('Member not found');
    }
    const ledger: OtherLedger = {
      id: uuidv4(),
      name,
      ownerType: params.ownerType,
      ownerMemberId: params.ownerMemberId,
      ownerName: params.ownerName?.trim(),
      startingDate: params.startingDate,
      openingBalance: params.openingBalance ?? 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await this.db.saveOtherLedger(ledger);
    return ledger;
  }

  async updateLedger(id: string, patch: Partial<Omit<OtherLedger, 'id' | 'createdAt'>>): Promise<OtherLedger> {
    const existing = await this.db.getOtherLedgerById(id);
    if (!existing) throw new Error('Ledger not found');
    const next: OtherLedger = { ...existing, ...patch, updatedAt: nowIso() };
    if (next.name.trim().length < 3 || next.name.trim().length > 50) throw new Error('Ledger name must be 3–50 characters');
    await this.db.saveOtherLedger(next);
    return next;
  }

  async deleteLedger(id: string): Promise<void> {
    await this.db.softDeleteOtherLedger(id);
  }

  async getEntries(ledgerId: string): Promise<OtherLedgerEntry[]> {
    const ledger = await this.db.getOtherLedgerById(ledgerId);
    if (!ledger) throw new Error('Ledger not found');
    const entries = await this.db.getOtherLedgerEntries(ledgerId);
    const sorted = sortOtherEntries(entries);
    const balMap = computeOtherRunningBalances(sorted, ledger.openingBalance);
    return sorted.map((e) => ({ ...e, balance: balMap.get(e.id) ?? 0 }));
  }

  async createEntry(params: {
    ledgerId: string;
    date: string;
    description: string;
    debit?: number;
    credit?: number;
    tags?: string[];
  }): Promise<OtherLedgerEntry> {
    const ledger = await this.db.getOtherLedgerById(params.ledgerId);
    if (!ledger) throw new Error('Ledger not found');
    const desc = params.description.trim();
    if (desc.length < 1 || desc.length > 200) throw new Error('Description must be 1–200 characters');
    if (!params.date || isNaN(Date.parse(params.date))) throw new Error('Valid date is required');
    if (params.date < ledger.startingDate) throw new Error('Date cannot be before ledger starting date');
    const debit = params.debit ?? 0;
    const credit = params.credit ?? 0;
    if (debit > 0 && credit > 0) throw new Error('Entry cannot have both debit and credit');
    if (debit <= 0 && credit <= 0) throw new Error('Entry must have debit or credit > 0');
    // compute new balance
    const existing = await this.db.getOtherLedgerEntries(params.ledgerId);
    const sorted = sortOtherEntries(existing);
    const balMap = computeOtherRunningBalances(sorted, ledger.openingBalance);
    const lastBal = sorted.length > 0 ? balMap.get(sorted[sorted.length - 1]!.id) ?? ledger.openingBalance : ledger.openingBalance;
    const newBal = lastBal + credit - debit;
    // but chronological position may not be last; we recompute all after insert via caller refresh
    const entry: OtherLedgerEntry = {
      id: uuidv4(),
      ledgerId: params.ledgerId,
      date: params.date,
      description: desc,
      debit,
      credit,
      balance: newBal,
      metadata: params.tags && params.tags.length > 0 ? { tags: params.tags } : {},
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await this.db.saveOtherLedgerEntry(entry);
    // recompute all balances correctly (in case inserted not at end)
    await this.recomputeBalances(params.ledgerId);
    const saved = await this.db.getOtherLedgerEntryById(entry.id);
    return saved ?? entry;
  }

  async updateEntry(id: string, patch: Partial<Omit<OtherLedgerEntry, 'id' | 'ledgerId'>>): Promise<OtherLedgerEntry> {
    const existing = await this.db.getOtherLedgerEntryById(id);
    if (!existing) throw new Error('Entry not found');
    const next: OtherLedgerEntry = { ...existing, ...patch, updatedAt: nowIso() } as OtherLedgerEntry;
    if (next.description.trim().length < 1 || next.description.trim().length > 200) throw new Error('Description must be 1–200');
    await this.db.saveOtherLedgerEntry(next);
    await this.recomputeBalances(next.ledgerId);
    const saved = await this.db.getOtherLedgerEntryById(id);
    return saved ?? next;
  }

  async deleteEntry(id: string): Promise<void> {
    const e = await this.db.getOtherLedgerEntryById(id);
    if (!e) throw new Error('Entry not found');
    await this.db.softDeleteOtherLedgerEntry(id);
    await this.recomputeBalances(e.ledgerId);
  }

  async recomputeBalances(ledgerId: string): Promise<void> {
    const ledger = await this.db.getOtherLedgerById(ledgerId);
    if (!ledger) return;
    const entries = await this.db.getOtherLedgerEntries(ledgerId);
    const sorted = sortOtherEntries(entries);
    let running = ledger.openingBalance;
    for (const e of sorted) {
      running += e.credit - e.debit;
      const updated: OtherLedgerEntry = { ...e, balance: running, updatedAt: nowSql() };
      // bypass validation flush via direct save
      await this.db.saveOtherLedgerEntry(updated);
    }
  }
}
