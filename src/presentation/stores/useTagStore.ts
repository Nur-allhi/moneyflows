import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TagState {
  /** Every tag ever used — powers autocomplete and the tag browser. */
  tags: string[];
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
}

export const useTagStore = create<TagState>()(
  persist(
    (set, get) => ({
      tags: [],
      addTag: (tag) => {
        const clean = tag.trim();
        if (!clean) return;
        const exists = get().tags.some((t) => t.toLowerCase() === clean.toLowerCase());
        if (!exists) set({ tags: [...get().tags, clean] });
      },
      removeTag: (tag) => set({ tags: get().tags.filter((t) => t !== tag) }),
    }),
    { name: 'moneyflows_tags' },
  ),
);
