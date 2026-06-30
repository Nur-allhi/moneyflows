import { create } from 'zustand';
import type { LoanStack } from '../../core/domain/Loan';
import { getDatabase } from '../../infrastructure/database/getDatabase';

interface LoanState {
  loanStacks: LoanStack[];
  loading: boolean;
  error: string | null;
  fetchLoanStacks: () => Promise<void>;
}

export const useLoanStore = create<LoanState>((set) => ({
  loanStacks: [],
  loading: false,
  error: null,

  fetchLoanStacks: async () => {
    set({ loading: true, error: null });
    try {
      const db = getDatabase();
      const loanStacks = await db.getLoanStacks();
      set({ loanStacks, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
}));
