import { create } from 'zustand';
import type { Transaction } from '../../core/domain/Transaction';
import type { TransactionFilter } from '../../core/ports/IDatabaseService';
import { getDatabase } from '../../infrastructure/database/getDatabase';

interface TransactionState {
  transactions: Transaction[];
  filters: TransactionFilter;
  loading: boolean;
  error: string | null;
  fetchTransactions: (filters?: TransactionFilter) => Promise<void>;
  setFilters: (filters: TransactionFilter) => void;
  addTransaction: (tx: Transaction) => Promise<void>;
  softDeleteTransaction: (id: string) => Promise<void>;
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
      const f = filters ?? get().filters;
      const transactions = await db.getTransactions(f);
      set({ transactions, filters: f, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  setFilters: (filters) => set({ filters }),

  addTransaction: async (tx) => {
    const prev = get().transactions;
    const db = getDatabase();
    set({ transactions: [tx, ...prev], error: null });
    try {
      await db.saveTransaction(tx);
    } catch (err) {
      set({ transactions: prev, error: (err as Error).message });
    }
  },

  softDeleteTransaction: async (id) => {
    try {
      const db = getDatabase();
      await db.softDeleteTransaction(id);
      set({ transactions: get().transactions.filter((t) => t.id !== id) });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));
