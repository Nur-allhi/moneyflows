import { create } from 'zustand';
import { getDatabase } from '../../../infrastructure/database/getDatabase';
import { OtherLedgerService } from '../../application/OtherLedgerService';
import type { OtherLedger, OtherLedgerEntry } from '../../domain/types';

interface OtherLedgerState {
  ledgers: OtherLedger[];
  entriesByLedger: Record<string, OtherLedgerEntry[]>;
  loading: boolean;
  error: string | null;
  fetchLedgers: () => Promise<void>;
  fetchEntries: (ledgerId: string) => Promise<void>;
  createLedger: (params: {
    name: string;
    startingDate: string;
    ownerType: 'member' | 'external';
    ownerMemberId?: string;
    ownerName?: string;
    openingBalance?: number;
  }) => Promise<OtherLedger>;
  updateLedger: (id: string, patch: { name?: string; startingDate?: string; ownerType?: 'member' | 'external'; ownerMemberId?: string; ownerName?: string; openingBalance?: number }) => Promise<void>;
  createEntry: (params: {
    ledgerId: string;
    date: string;
    description: string;
    debit?: number;
    credit?: number;
    tags?: string[];
  }) => Promise<void>;
  updateEntry: (id: string, patch: Partial<OtherLedgerEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  deleteLedger: (id: string) => Promise<void>;
}

export const useOtherLedgerStore = create<OtherLedgerState>((set, get) => ({
  ledgers: [],
  entriesByLedger: {},
  loading: false,
  error: null,

  fetchLedgers: async () => {
    set({ loading: true, error: null });
    try {
      const db = await getDatabase();
      const svc = new OtherLedgerService(db);
      const ledgers = await svc.getLedgers();
      set({ ledgers, loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e), loading: false });
    }
  },

  fetchEntries: async (ledgerId: string) => {
    set({ loading: true, error: null });
    try {
      const db = await getDatabase();
      const svc = new OtherLedgerService(db);
      const entries = await svc.getEntries(ledgerId);
      set((s) => ({ entriesByLedger: { ...s.entriesByLedger, [ledgerId]: entries }, loading: false }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e), loading: false });
    }
  },

  createLedger: async (params) => {
    const db = await getDatabase();
    const svc = new OtherLedgerService(db);
    const ledger = await svc.createLedger(params);
    await get().fetchLedgers();
    return ledger;
  },

  updateLedger: async (id, patch) => {
    const db = await getDatabase();
    const svc = new OtherLedgerService(db);
    await svc.updateLedger(id, patch);
    await get().fetchLedgers();
  },

  createEntry: async (params) => {
    const db = await getDatabase();
    const svc = new OtherLedgerService(db);
    await svc.createEntry(params);
    await get().fetchEntries(params.ledgerId);
    await get().fetchLedgers();
  },

  updateEntry: async (id, patch) => {
    const db = await getDatabase();
    const svc = new OtherLedgerService(db);
    // need ledgerId for refresh; fetch before update
    let ledgerId: string | undefined;
    for (const entries of Object.values(get().entriesByLedger)) {
      const found = (entries as OtherLedgerEntry[]).find((x) => x.id === id);
      if (found) { ledgerId = found.ledgerId; break; }
    }
    await svc.updateEntry(id, patch as Partial<Omit<OtherLedgerEntry, 'id' | 'ledgerId'>>);
    if (ledgerId) await get().fetchEntries(ledgerId);
  },

  deleteEntry: async (id) => {
    let ledgerId: string | undefined;
    for (const entries of Object.values(get().entriesByLedger)) {
      const found = (entries as OtherLedgerEntry[]).find((x) => x.id === id);
      if (found) { ledgerId = found.ledgerId; break; }
    }
    const db = await getDatabase();
    const svc = new OtherLedgerService(db);
    await svc.deleteEntry(id);
    if (ledgerId) await get().fetchEntries(ledgerId);
  },

  deleteLedger: async (id) => {
    const db = await getDatabase();
    const svc = new OtherLedgerService(db);
    await svc.deleteLedger(id);
    await get().fetchLedgers();
  },
}));
