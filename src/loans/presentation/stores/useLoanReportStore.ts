import { create } from 'zustand';
import type { LoanReport, LoanReportFilter } from '../../domain/types';
import { getDatabase } from '../../../infrastructure/database/getDatabase';
import { LoanService } from '../../application/LoanService';

interface LoanReportState {
  report: LoanReport | null;
  loading: boolean;
  error: string | null;
  generateReport: (filter: LoanReportFilter) => Promise<void>;
  clearReport: () => void;
}

export const useLoanReportStore = create<LoanReportState>((set) => ({
  report: null,
  loading: false,
  error: null,

  generateReport: async (filter) => {
    set({ loading: true, error: null, report: null });
    try {
      const service = new LoanService(getDatabase());
      const report = await service.generateReport(filter);
      set({ report, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  clearReport: () => set({ report: null, error: null }),
}));
