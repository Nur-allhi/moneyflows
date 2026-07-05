import { create } from 'zustand';
import type { Loan, LoanStack } from '../../domain/types';
import { getDatabase } from '../../../infrastructure/database/getDatabase';
import { LoanService } from '../../application/LoanService';
import { useTransactionStore } from '../../../presentation/stores/useTransactionStore';
import { useAccountStore } from '../../../presentation/stores/useAccountStore';

interface LoanState {
  loanStacks: LoanStack[];
  loans: Loan[];
  loading: boolean;
  error: string | null;

  fetchLoanStacks: () => Promise<void>;
  getLoanById: (id: string) => Promise<Loan | null>;

  createLoan: (params: {
    lenderAccountId: string;
    borrowerAccountId: string;
    amount: number;
    description: string;
    date: string;
    memberId: string;
  }) => Promise<void>;

  recordRepayment: (params: {
    borrowerAccountId: string;
    amount: number;
    description: string;
    date: string;
    memberId: string;
    destinationAccountId?: string;
  }) => Promise<void>;

  createCounterparty: (name: string, type?: string) => Promise<{ accountId: string }>;
  settleLoan: (loanId: string) => Promise<void>;
  deleteLoan: (loanId: string) => Promise<void>;
  settleLoanStack: (counterpartyId: string) => Promise<void>;
  deleteLoanStack: (counterpartyId: string) => Promise<void>;
  createGivenLoan: (params: { sourceAccount: string; destAccount: string; amount: number; description: string; date: string; memberId: string }) => Promise<void>;
  createReceivedLoan: (params: { sourceAccount: string; destAccount: string; amount: number; description: string; date: string; memberId: string }) => Promise<void>;
  recordPayback: (params: { sourceAccount: string; destAccount: string; amount: number; loanRef: string; description: string; date: string; memberId: string }) => Promise<void>;
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
      const service = getService();
      const loanStacks = await service.getLoanStacks();
      set({ loanStacks, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createLoan: async (params) => {
    set({ error: null });
    try {
      const service = getService();
      await service.createLoan(params);
      const loanStacks = await service.getLoanStacks();
      set({ loanStacks });
      await useTransactionStore.getState().fetchTransactions();
      await useAccountStore.getState().fetchAccounts();
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  getLoanById: async (id) => {
    try {
      return await getService().getLoanById(id);
    } catch {
      return null;
    }
  },

  recordRepayment: async (params) => {
    set({ error: null });
    try {
      const service = getService();
      await service.recordRepayment(params);
      const loanStacks = await service.getLoanStacks();
      set({ loanStacks });
      await useTransactionStore.getState().fetchTransactions();
      await useAccountStore.getState().fetchAccounts();
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  createCounterparty: async (name, _type?: string) => {
    set({ error: null });
    try {
      const service = getService();
      const result = await service.createCounterparty(name);
      await useAccountStore.getState().fetchAccounts();
      return result;
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  settleLoan: async (loanId) => {
    set({ error: null });
    try {
      const service = getService();
      await service.settleLoan(loanId);
      const loanStacks = await service.getLoanStacks();
      set({ loanStacks });
      await useTransactionStore.getState().fetchTransactions();
      await useAccountStore.getState().fetchAccounts();
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  deleteLoan: async (loanId) => {
    set({ error: null });
    try {
      const service = getService();
      await service.deleteLoan(loanId);
      const loanStacks = await service.getLoanStacks();
      set({ loanStacks });
      await useTransactionStore.getState().fetchTransactions();
      await useAccountStore.getState().fetchAccounts();
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  settleLoanStack: async (counterpartyId) => {
    set({ error: null });
    try {
      const service = getService();
      const loans = await service.getLoansByBorrower(counterpartyId);
      for (const loan of loans) {
        await service.settleLoan(loan.id);
      }
      const loanStacks = await service.getLoanStacks();
      set({ loanStacks });
      await useTransactionStore.getState().fetchTransactions();
      await useAccountStore.getState().fetchAccounts();
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  deleteLoanStack: async (counterpartyId) => {
    set({ error: null });
    try {
      const service = getService();
      const loans = await service.getLoansByBorrower(counterpartyId);
      for (const loan of loans) {
        await service.deleteLoan(loan.id);
      }
      const loanStacks = await service.getLoanStacks();
      set({ loanStacks });
      await useTransactionStore.getState().fetchTransactions();
      await useAccountStore.getState().fetchAccounts();
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  createGivenLoan: async (params) => {
    set({ error: null });
    try {
      const service = getService();
      await service.createLoan({
        lenderAccountId: params.sourceAccount,
        borrowerAccountId: params.destAccount,
        amount: params.amount,
        description: params.description,
        date: params.date,
        memberId: params.memberId,
      });
      const loanStacks = await service.getLoanStacks();
      set({ loanStacks });
      await useTransactionStore.getState().fetchTransactions();
      await useAccountStore.getState().fetchAccounts();
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  createReceivedLoan: async (params) => {
    set({ error: null });
    try {
      const service = getService();
      await service.createLoan({
        lenderAccountId: params.sourceAccount,
        borrowerAccountId: params.destAccount,
        amount: params.amount,
        description: params.description,
        date: params.date,
        memberId: params.memberId,
      });
      const loanStacks = await service.getLoanStacks();
      set({ loanStacks });
      await useTransactionStore.getState().fetchTransactions();
      await useAccountStore.getState().fetchAccounts();
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  recordPayback: async (params) => {
    set({ error: null });
    try {
      const service = getService();
      await service.recordRepayment({
        borrowerAccountId: params.sourceAccount,
        amount: params.amount,
        description: params.description,
        date: params.date,
        memberId: params.memberId,
        destinationAccountId: params.destAccount,
      });
      const loanStacks = await service.getLoanStacks();
      set({ loanStacks });
      await useTransactionStore.getState().fetchTransactions();
      await useAccountStore.getState().fetchAccounts();
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },
}));
