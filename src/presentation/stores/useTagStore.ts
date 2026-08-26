import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TagState {
  /** Every tag ever used — powers autocomplete and the tag browser. */
  tags: string[];
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  /** Renames everywhere in the registry; merges when the new name already exists. */
  renameTag: (oldName: string, newName: string) => void;
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
      renameTag: (oldName, newName) => {
        const clean = newName.trim();
        const rest = get().tags.filter((t) => t !== oldName && t.toLowerCase() !== clean.toLowerCase());
        set({ tags: clean ? [...rest, clean] : rest });
      },
    }),
    { name: 'moneyflows_tags' },
  ),
);
