import { create } from 'zustand';
import type { Loan, LoanStack, LoanDirection } from '../../core/domain/Loan';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import { LoanService } from '../../core/application/LoanService';
import type { CreateGivenLoanParams, CreateReceivedLoanParams, RecordRepaymentParams, RecordPaybackParams } from '../../core/application/LoanService';

interface LoanState {
  loanStacks: LoanStack[];
  loans: Loan[];
  loading: boolean;
  error: string | null;
  fetchLoanStacks: () => Promise<void>;
  fetchLoans: (direction?: LoanDirection) => Promise<void>;
  createGivenLoan: (params: CreateGivenLoanParams) => Promise<void>;
  createReceivedLoan: (params: CreateReceivedLoanParams) => Promise<void>;
  recordRepayment: (params: RecordRepaymentParams) => Promise<void>;
  recordPayback: (params: RecordPaybackParams) => Promise<void>;
  createCounterparty: (name: string, type: 'debtor' | 'creditor') => Promise<{ accountId: string }>;
  deleteLoanStack: (counterpartyId: string) => Promise<void>;
}

const getService = () => new LoanService(getDatabase());

export const useLoanStore = create<LoanState>((set) => ({
  loanStacks: [],
  loans: [],
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

  fetchLoans: async (direction?: LoanDirection) => {
    set({ loading: true, error: null });
    try {
      const service = getService();
      const loans = await service.getLoans(direction);
      set({ loans, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createGivenLoan: async (params) => {
    set({ error: null });
    try {
      const service = getService();
      await service.createGivenLoan(params);
      await getDatabase().getLoanStacks().then((stacks) => set({ loanStacks: stacks }));
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  createReceivedLoan: async (params) => {
    set({ error: null });
    try {
      const service = getService();
      await service.createReceivedLoan(params);
      await getDatabase().getLoanStacks().then((stacks) => set({ loanStacks: stacks }));
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  recordRepayment: async (params) => {
    set({ error: null });
    try {
      const service = getService();
      await service.recordRepayment(params);
      await getDatabase().getLoanStacks().then((stacks) => set({ loanStacks: stacks }));
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  recordPayback: async (params) => {
    set({ error: null });
    try {
      const service = getService();
      await service.recordPayback(params);
      await getDatabase().getLoanStacks().then((stacks) => set({ loanStacks: stacks }));
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  createCounterparty: async (name, type) => {
    set({ error: null });
    try {
      const service = getService();
      const result = await service.createCounterparty(name, type);
      return { accountId: result.account.id };
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  deleteLoanStack: async (counterpartyId) => {
    set({ error: null });
    try {
      const service = getService();
      await service.deleteLoanStack(counterpartyId);
      await getDatabase().getLoanStacks().then((stacks) => set({ loanStacks: stacks }));
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },
}));