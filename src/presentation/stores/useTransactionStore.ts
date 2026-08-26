import { create } from 'zustand';
import type { Transaction } from '../../core/domain/Transaction';
import type { TransactionFilter } from '../../core/ports/IDatabaseService';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import { logger } from '../../core/logging';

interface TransactionState {
  transactions: Transaction[];
  filters: TransactionFilter;
  loading: boolean;
  error: string | null;
  fetchTransactions: (filters?: TransactionFilter) => Promise<void>;
  setFilters: (filters: TransactionFilter) => void;
  addTransaction: (tx: Transaction) => Promise<void>;
  updateTransaction: (id: string, tx: Transaction) => Promise<void>;
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
      const f = filters ?? {};
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
      logger.activity(`Added ${tx.type} — ${tx.description}`, { type: tx.type, amount: tx.amount, description: tx.description });
    } catch (err) {
      logger.error('store', 'addTransaction failed', { type: tx.type }, (err as Error).stack);
      set({ transactions: prev, error: (err as Error).message });
    }
  },

  updateTransaction: async (id, tx) => {
    const prev = get().transactions;
    const db = getDatabase();
    set({ transactions: prev.map((t) => (t.id === id ? tx : t)), error: null });
    try {
      await db.updateTransaction(id, tx);
      logger.activity(`Updated transaction — ${tx.description}`, { id, type: tx.type });
    } catch (err) {
      logger.error('store', 'updateTransaction failed', { id }, (err as Error).stack);
      set({ transactions: prev, error: (err as Error).message });
    }
  },

  softDeleteTransaction: async (id) => {
    try {
      const db = getDatabase();
      await db.softDeleteTransaction(id);
      set({ transactions: get().transactions.filter((t) => t.id !== id) });
      logger.activity('Deleted transaction', { id });
    } catch (err) {
      logger.error('store', 'softDeleteTransaction failed', { id }, (err as Error).stack);
      set({ error: (err as Error).message });
    }
  },
}));
