import { create } from 'zustand';
import type { Transaction } from '../../core/domain/Transaction';
import type { TransactionFilter } from '../../core/ports/IDatabaseService';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import { OtherLedgerService } from '../../otherLedgers/application/OtherLedgerService';
import { useOtherLedgerStore } from '../../otherLedgers/presentation/stores/useOtherLedgerStore';
import { logger } from '../../core/logging';

/** T-120: optional side-by-side ledger post bound to the same save. */
export interface LedgerLinkChoice {
  ledgerId: string;
  side: 'debit' | 'credit';
}

interface TransactionState {
  transactions: Transaction[];
  filters: TransactionFilter;
  loading: boolean;
  error: string | null;
  fetchTransactions: (filters?: TransactionFilter) => Promise<void>;
  setFilters: (filters: TransactionFilter) => void;
  addTransaction: (tx: Transaction, ledgerLink?: LedgerLinkChoice) => Promise<void>;
  updateTransaction: (id: string, tx: Transaction, ledgerSync?: 'linked' | 'unlink') => Promise<void>;
  softDeleteTransaction: (id: string, deleteLinkedEntry?: boolean) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  filters: {},
  loading: false,
  error: null,

  fetchTransactions: async (filters?: TransactionFilter) => {
    set({ loading: true, error: null });
    try {
      const db = getDatabase();
      const f = filters ?? {};
      const transactions = await db.getTransactions(f);
      set({ transactions, filters: f, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  setFilters: (filters) => set({ filters }),

  addTransaction: async (tx, ledgerLink) => {
    const prev = get().transactions;
    const db = getDatabase();
    set({ transactions: [tx, ...prev], error: null });
    try {
      if (ledgerLink && ledgerLink.ledgerId) {
        // Dual-post: the transaction and its ledger mirror land through one
        // DB-level write, so a refused post leaves neither behind (T-120).
        const svc = new OtherLedgerService(db);
        await svc.createLinkedEntryFromTransaction({
          tx,
          ledgerId: ledgerLink.ledgerId,
          side: ledgerLink.side,
        });
        void useOtherLedgerStore.getState().fetchLedgers();
        void useOtherLedgerStore.getState().fetchEntries(ledgerLink.ledgerId);
      } else {
        await db.saveTransaction(tx);
      }
      logger.activity(`Added ${tx.type} — ${tx.description}`, { type: tx.type, amount: tx.amount, description: tx.description });
    } catch (err) {
      logger.error('store', 'addTransaction failed', { type: tx.type }, (err as Error).stack);
      set({ transactions: prev, error: (err as Error).message });
    }
  },

  updateTransaction: async (id, tx, ledgerSync) => {
    const prev = get().transactions;
    const db = getDatabase();
    set({ transactions: prev.map((t) => (t.id === id ? tx : t)), error: null });
    try {
      await db.updateTransaction(id, tx);
      // T-122: the mirror row follows the source tx (or is cut loose) after the
      // source write succeeded — an unlink is still a follow-up write.
      if (ledgerSync) {
        const touched = await new OtherLedgerService(db).syncLinkedEntryAfterTransactionUpdate(tx, ledgerSync);
        if (touched) {
          void useOtherLedgerStore.getState().fetchLedgers();
          void useOtherLedgerStore.getState().fetchEntries(touched.ledgerId);
        }
      }
      logger.activity(`Updated transaction — ${tx.description}`, { id, type: tx.type });
    } catch (err) {
      logger.error('store', 'updateTransaction failed', { id }, (err as Error).stack);
      set({ transactions: prev, error: (err as Error).message });
    }
  },

  softDeleteTransaction: async (id, deleteLinkedEntry) => {
    try {
      let linkedLedgerId: string | null = null;
      if (deleteLinkedEntry) {
        // T-122: deleting through the prompt takes the mirror row down with the
        // source transaction (both restorable from the Recycle Bin).
        const db0 = getDatabase();
        const entry = await db0.getOtherLedgerEntryByTransactionId(id);
        if (entry) {
          await new OtherLedgerService(db0).deleteEntry(entry.id);
          linkedLedgerId = entry.ledgerId;
        }
      }
      const db = getDatabase();
      await db.softDeleteTransaction(id);
      set({ transactions: get().transactions.filter((t) => t.id !== id) });
      if (linkedLedgerId) {
        void useOtherLedgerStore.getState().fetchLedgers();
        void useOtherLedgerStore.getState().fetchEntries(linkedLedgerId);
      }
      logger.activity('Deleted transaction', { id });
    } catch (err) {
      logger.error('store', 'softDeleteTransaction failed', { id }, (err as Error).stack);
      set({ error: (err as Error).message });
    }
  },
}));
