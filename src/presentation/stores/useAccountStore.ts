import { create } from 'zustand';
import { Account } from '../../core/domain/Account';
import { getDatabase } from '../../infrastructure/database/getDatabase';

interface AccountState {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  fetchAccounts: (memberId?: string) => Promise<void>;
  saveAccount: (account: Account) => Promise<void>;
  softDeleteAccount: (id: string) => Promise<void>;
  getByMember: (memberId: string) => Account[];
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  loading: false,
  error: null,

  fetchAccounts: async (memberId?: string) => {
    set({ loading: true, error: null });
    try {
      const db = getDatabase();
      const accounts = await db.getAccounts(memberId);
      set({ accounts, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  saveAccount: async (account) => {
    try {
      const db = getDatabase();
      await db.saveAccount(account);
      const accounts = get().accounts.map((a) => (a.id === account.id ? account : a));
      if (!accounts.find((a) => a.id === account.id)) accounts.push(account);
      set({ accounts });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  softDeleteAccount: async (id) => {
    try {
      const db = getDatabase();
      await db.softDeleteAccount(id);
      set({ accounts: get().accounts.filter((a) => a.id !== id) });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  getByMember: (memberId) => get().accounts.filter((a) => a.memberId === memberId),
}));
