import { create } from 'zustand';
import type { DeletedItem } from '../../core/ports/IDatabaseService';
import { getDatabase } from '../../infrastructure/database/getDatabase';

interface RecycleState {
  deletedItems: DeletedItem[];
  loading: boolean;
  error: string | null;
  fetchDeleted: (type?: DeletedItem['type']) => Promise<void>;
  restore: (id: string, type: DeletedItem['type']) => Promise<void>;
  purge: (id: string, type: DeletedItem['type']) => Promise<void>;
}

export const useRecycleStore = create<RecycleState>((set, get) => ({
  deletedItems: [],
  loading: false,
  error: null,

  fetchDeleted: async (type?) => {
    set({ loading: true, error: null });
    try {
      const db = getDatabase();
      const deletedItems = await db.getDeletedItems(type);
      set({ deletedItems, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  restore: async (id, type) => {
    try {
      const db = getDatabase();
      await db.restoreItem(id, type);
      set({ deletedItems: get().deletedItems.filter((item) => !(item.id === id && item.type === type)) });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  purge: async (id, type) => {
    try {
      const db = getDatabase();
      await db.purgeItem(id, type);
      set({ deletedItems: get().deletedItems.filter((item) => !(item.id === id && item.type === type)) });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));
