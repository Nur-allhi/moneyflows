import { create } from 'zustand';
import { Member } from '../../core/domain/Member';
import { getDatabase } from '../../infrastructure/database/getDatabase';

interface MemberState {
  members: Member[];
  activeMemberId: string | null;
  loading: boolean;
  error: string | null;
  fetchMembers: (includeDeleted?: boolean) => Promise<void>;
  setActiveMember: (id: string | null) => void;
  saveMember: (member: Member) => Promise<void>;
  softDeleteMember: (id: string) => Promise<void>;
}

export const useMemberStore = create<MemberState>((set, get) => ({
  members: [],
  activeMemberId: null,
  loading: false,
  error: null,

  fetchMembers: async (includeDeleted?: boolean) => {
    set({ loading: true, error: null });
    try {
      const db = getDatabase();
      const members = await db.getMembers(includeDeleted);
      set({ members, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  setActiveMember: (id) => set({ activeMemberId: id }),

  saveMember: async (member) => {
    try {
      const db = getDatabase();
      await db.saveMember(member);
      const members = get().members.map((m) => (m.id === member.id ? member : m));
      if (!members.find((m) => m.id === member.id)) members.push(member);
      set({ members });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  softDeleteMember: async (id) => {
    try {
      const db = getDatabase();
      await db.softDeleteMember(id);
      set({ members: get().members.filter((m) => m.id !== id) });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));
