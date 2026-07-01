import { create } from 'zustand';

export interface ModalInstance {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

interface ModalState {
  modals: ModalInstance[];
  closingIds: string[];
  open: (type: string, props?: Record<string, unknown>) => string;
  close: (id: string) => void;
  closeAll: () => void;
}

let nextId = 1;

export const useModalStore = create<ModalState>((set, get) => ({
  modals: [],
  closingIds: [],
  open: (type, props = {}) => {
    const id = `modal_${nextId++}`;
    set((s) => ({ modals: [...s.modals, { id, type, props }] }));
    return id;
  },
  close: (id) => {
    set((s) => ({ closingIds: [...s.closingIds, id] }));
    setTimeout(() => {
      set((s) => ({
        modals: s.modals.filter((m) => m.id !== id),
        closingIds: s.closingIds.filter((c) => c !== id),
      }));
    }, 300);
  },
  closeAll: () => {
    const ids = get().modals.map((m) => m.id);
    set((s) => ({ closingIds: [...s.closingIds, ...ids] }));
    setTimeout(() => {
      set({ modals: [], closingIds: [] });
    }, 300);
  },
}));
