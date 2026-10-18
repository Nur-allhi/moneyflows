import type { Database as SqlJsDb } from 'sql.js';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '../../core/domain/Transaction';
import { Account } from '../../core/domain/Account';
import type { IDatabaseService } from '../../core/ports/IDatabaseService';
import type { Loan, LoanStack, LoanReport, LoanReportFilter, LoanReportRow, LoanReportSummary } from '../domain/types';
import { OverpaymentError, RepaymentEditError } from '../domain/errors';
import { recordAllocations } from '../domain/repaymentAllocations';
import type { LoanAllocation } from '../domain/repaymentAllocations';
import { repaymentEditViolation } from '../domain/repaymentEdit';
import { LoanDatabase } from '../infrastructure/LoanDatabase';
import { computeRunningBalances, sortLoanTransactions, LOAN_CREDIT_TYPES, LOAN_DEBIT_TYPES } from './computeRunningBalances';
import { SQLiteDatabaseService } from '../../infrastructure/database/SQLiteDatabaseService';

export class LoanService {
  private db: IDatabaseService;
  private loanDb: LoanDatabase;

  constructor(db: IDatabaseService) {
    this.db = db;
    if (db instanceof SQLiteDatabaseService) {
      const raw = db.getSqlJsDb();
      if (!raw) throw new Error('Database not initialized');
      // The loan tables are written straight into the raw database, so the
      // service that owns persistence has to be told, or the write is never
      // flushed (BUG-46).
      this.loanDb = new LoanDatabase(raw as SqlJsDb, () => db.markDirty());
    } else {
      throw new Error('LoanService requires SQLiteDatabaseService');
    }
  }

  async createLoan(params: {
    lenderAccountId: string;
    borrowerAccountId: string;
    amount: number;
    description: string;
    date: string;
    memberId: string;
  }): Promise<{ loan: Loan; tx: Transaction }> {
    const now = new Date();
    const nowStr = now.toISOString();
    const [y, m, d] = params.date.split('-');
    const dateTime = new Date(Number(y), Number(m) - 1, Number(d), now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();

    const existing = await this.db.getAccountById(params.borrowerAccountId);
    if (!existing) {
      throw new Error(`Borrower account ${params.borrowerAccountId} not found`);
    }

    const loan: Loan = {
      id: uuidv4(),
      lenderAccountId: params.lenderAccountId,
      borrowerAccountId: params.borrowerAccountId,
      principal: params.amount,
      outstanding: params.amount,
      status: 'active',
      description: params.description,
      metadata: {},
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    const tx = new Transaction(
      uuidv4(), 'lend', params.description, params.amount,
      params.memberId, dateTime, params.lenderAccountId, params.borrowerAccountId,
      undefined, loan.id, {}, nowStr, nowStr,
    );

    await this.loanDb.saveLoan(loan);
    await this.db.saveTransaction(tx);
    return { loan, tx };
  }

  async recordRepayment(params: {
    borrowerAccountId: string;
    amount: number;
    description: string;
    date: string;
    memberId: string;
    destinationAccountId?: string;
    lenderAccountId?: string;
  }): Promise<{ tx: Transaction }> {
    if (!params.borrowerAccountId) throw new Error('borrowerAccountId is required for repayment');

    const allLoans = await this.loanDb.getLoansByBorrower(params.borrowerAccountId);
    const activeLoans = allLoans.filter((l) => l.status !== 'settled' && l.outstanding > 0);
    if (activeLoans.length === 0) throw new Error('No active loans found for this counterparty');

    if (params.lenderAccountId && !activeLoans.some((l) => l.lenderAccountId === params.lenderAccountId)) {
      throw new Error('No active loans found for the selected lender');
    }

    const now = new Date();
    const nowStr = now.toISOString();
    const [y, m, d] = params.date.split('-');
    const dateTime = new Date(Number(y), Number(m) - 1, Number(d), now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();

    const firstLoan = activeLoans[0]!;
    const dst = params.destinationAccountId ?? params.lenderAccountId ?? firstLoan.lenderAccountId;

    let remaining = params.amount;
    const byAge = [...activeLoans].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    // Targeted repayment: the chosen lender's loans first (oldest first),
    // remainder spills over to the other lenders' loans (oldest first).
    const ordered = params.lenderAccountId
      ? [...byAge.filter((l) => l.lenderAccountId === params.lenderAccountId),
         ...byAge.filter((l) => l.lenderAccountId !== params.lenderAccountId)]
      : byAge;

    // Refuse an overpayment before anything is written (BUG-23). The loop below
    // clamps each loan at what it still owes, so anything above the total
    // outstanding had nowhere to go — yet the transaction was still booked at
    // the full amount, leaving the ledger claiming more repaid than the loan
    // records ever received. Refusing is the whole repayment, not a partial one:
    // a rejected save must leave every loan exactly as it was.
    const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.outstanding, 0);
    if (params.amount > totalOutstanding) {
      throw new OverpaymentError(params.amount, totalOutstanding);
    }

    const allocations: LoanAllocation[] = [];
    for (const loan of ordered) {
      if (remaining <= 0) break;
      if (loan.outstanding <= 0) continue;

      const applied = Math.min(remaining, loan.outstanding);
      loan.outstanding -= applied;
      remaining -= applied;
      allocations.push({ loanId: loan.id, amount: applied });

      if (loan.outstanding <= 0) {
        loan.outstanding = 0;
        loan.status = 'settled';
      }
      loan.updatedAt = nowStr;
      await this.loanDb.saveLoan(loan);
    }

    // The split is recorded on the transaction, so an edit later knows exactly
    // what to reverse (BUG-47). When one loan absorbed the whole repayment that
    // is also a real link, recorded the way `createLoan` records it — the detail
    // view and `deleteLoan` read `loanRef`. A split has no single loan to point
    // at, so it carries only the split.
    const soleLoanId = allocations.length === 1 ? allocations[0]!.loanId : undefined;

    const tx = new Transaction(
      uuidv4(), 'repay', params.description, params.amount,
      params.memberId, dateTime, params.borrowerAccountId, dst,
      undefined, soleLoanId, recordAllocations(undefined, allocations), nowStr, nowStr,
    );

    await this.db.saveTransaction(tx);
    return { tx };
  }

  async getLoanById(id: string): Promise<Loan | null> {
    return this.loanDb.getLoanById(id);
  }

  async getLoansByBorrower(borrowerAccountId: string): Promise<Loan[]> {
    return this.loanDb.getLoansByBorrower(borrowerAccountId);
  }

  async getLoanStacks(): Promise<LoanStack[]> {
    return this.loanDb.getLoanStacks();
  }

  async createCounterparty(name: string): Promise<{ accountId: string }> {
    const now = new Date().toISOString();
    const account = new Account(
      uuidv4(), undefined, name,
      'counterparty', 0, 'BDT', undefined, undefined, true,
      { counterpartyType: 'debtor' }, now, now,
    );

    await this.db.saveAccount(account);
    return { accountId: account.id };
  }

  /**
   * Refuses an edit to a repayment that its loans cannot absorb, without
   * touching anything. The edit modal calls this *before* saving the
   * transaction, because the transaction write and the loan sync are separate
   * steps: checking afterwards would leave the edited amount on the ledger with
   * the loan record clamped, which is BUG-40.
   *
   * Two shapes, because a repayment comes in two shapes (BUG-47):
   *
   * - a repayment that recorded its split can be reversed exactly, so a cut
   *   always fits and a raise is limited by what the borrower's loans still owe
   *   between them;
   * - one with only a `loanRef` (legacy rows, written before the split was
   *   recorded) can only be judged against that single loan, and the rule is the
   *   conservative one in `repaymentEditViolation`.
   */
  async assertRepaymentEditAllowed(
    loanRef: string | undefined,
    oldAmount: number,
    newAmount: number,
    allocations: LoanAllocation[] = [],
  ): Promise<void> {
    if (oldAmount === newAmount) return;

    if (allocations.length > 0) {
      if (newAmount < oldAmount) return;
      const borrowerAccountId = await this.borrowerOfAllocations(allocations);
      if (!borrowerAccountId) return;
      const loans = await this.loanDb.getLoansByBorrower(borrowerAccountId);
      const room = loans
        .filter((l) => !l.deletedAt)
        .reduce((sum, l) => sum + Math.max(0, l.outstanding), 0);
      if (newAmount - oldAmount > room) {
        throw new RepaymentEditError({ direction: 'increase', room, limit: oldAmount + room, scope: 'loans' });
      }
      return;
    }

    if (!loanRef) return;
    const loan = await this.loanDb.getLoanById(loanRef);
    if (!loan) return;
    const violation = repaymentEditViolation(loan, oldAmount, newAmount);
    if (violation) throw new RepaymentEditError(violation);
  }

  async syncLoanTransaction(
    loanRef: string | undefined,
    oldAmount: number,
    newAmount: number,
    txType: string,
    allocations: LoanAllocation[] = [],
  ): Promise<void> {
    // A repayment that recorded its split is reversed and re-applied loan by
    // loan (BUG-47) — that is the whole reason the split is recorded. There is
    // no delta to apply, and `loanRef` is only set when one loan took it all.
    if (txType === 'repay' && allocations.length > 0) {
      await this.reapplyRepayment(allocations, newAmount);
      return;
    }
    if (!loanRef) return;
    const loan = await this.loanDb.getLoanById(loanRef);
    if (!loan) return;
    const diff = newAmount - oldAmount;
    if (txType === 'lend') {
      loan.principal += diff;
      loan.outstanding += diff;
    } else if (txType === 'repay') {
      // Refuse rather than clamp: an edit the linked loan cannot absorb would
      // otherwise move the ledger and leave the loan record behind (BUG-40).
      const violation = repaymentEditViolation(loan, oldAmount, newAmount);
      if (violation) throw new RepaymentEditError(violation);
      loan.outstanding -= diff;
    }
    loan.outstanding = Math.max(0, loan.outstanding);
    loan.status = loan.outstanding <= 0 ? 'settled' : 'active';
    loan.updatedAt = new Date().toISOString();
    await this.loanDb.saveLoan(loan);
  }

  /** The borrower a recorded split belongs to: any of its loans knows. */
  private async borrowerOfAllocations(allocations: LoanAllocation[]): Promise<string | undefined> {
    for (const allocation of allocations) {
      const loan = await this.loanDb.getLoanById(allocation.loanId);
      if (loan) return loan.borrowerAccountId;
    }
    return undefined;
  }

  /**
   * Reverse a recorded split and apply an edited amount in its place (BUG-47).
   *
   * The reversal is exact — every loan gets back precisely what this repayment
   * took from it — which is why a cut can always be honoured: it can never give
   * back more than was taken. The new amount is then walked over the same loans,
   * in the order the split recorded, so a smaller repayment pays the same loans
   * first instead of rearranging them; a raise past what the split held continues
   * with the borrower's remaining loans, oldest first, exactly as
   * `recordRepayment` allocates. Only rows whose figures actually move are
   * written, timestamped like every other write (BUG-35).
   */
  private async reapplyRepayment(allocations: LoanAllocation[], newAmount: number): Promise<void> {
    const touched = new Map<string, Loan>();
    const before = new Map<string, { outstanding: number; status: Loan['status'] }>();

    for (const allocation of allocations) {
      const loan = await this.loanDb.getLoanById(allocation.loanId);
      if (!loan || loan.deletedAt) continue; // gone: there is nothing to give back to
      if (!touched.has(loan.id)) before.set(loan.id, { outstanding: loan.outstanding, status: loan.status });
      loan.outstanding = Math.min(loan.principal, loan.outstanding + allocation.amount);
      touched.set(loan.id, loan);
    }

    let remaining = newAmount;
    const apply = (loan: Loan) => {
      if (remaining <= 0) return;
      const applied = Math.min(remaining, loan.outstanding);
      loan.outstanding -= applied;
      remaining -= applied;
    };

    for (const allocation of allocations) {
      const loan = touched.get(allocation.loanId);
      if (loan) apply(loan);
    }

    if (remaining > 0) {
      const borrowerAccountId = await this.borrowerOfAllocations(allocations);
      if (borrowerAccountId) {
        const rest = (await this.loanDb.getLoansByBorrower(borrowerAccountId))
          .filter((l) => !l.deletedAt && !touched.has(l.id) && l.outstanding > 0)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        for (const loan of rest) {
          before.set(loan.id, { outstanding: loan.outstanding, status: loan.status });
          apply(loan);
          touched.set(loan.id, loan);
        }
      }
      // Nothing left to apply to can only mean the edit was checked against a
      // smaller room than this — refuse rather than book a figure the loans
      // cannot carry (BUG-40/BUG-23's rule, applied to the split).
      if (remaining > 0) {
        throw new RepaymentEditError({ direction: 'increase', room: newAmount - remaining, limit: newAmount - remaining, scope: 'loans' });
      }
    }

    const now = new Date().toISOString();
    for (const loan of touched.values()) {
      const outstanding = Math.max(0, loan.outstanding);
      const status: Loan['status'] = outstanding <= 0 ? 'settled' : 'active';
      const was = before.get(loan.id);
      if (was && was.outstanding === outstanding && was.status === status) continue;
      loan.outstanding = outstanding;
      loan.status = status;
      loan.updatedAt = now;
      await this.loanDb.saveLoan(loan);
    }
  }

  async settleLoan(loanId: string): Promise<void> {
    const loan = await this.loanDb.getLoanById(loanId);
    if (!loan) throw new Error(`Loan ${loanId} not found`);
    loan.outstanding = 0;
    loan.status = 'settled';
    loan.updatedAt = new Date().toISOString();
    await this.loanDb.saveLoan(loan);
  }

  async reverseRepayment(borrowerAccountId: string, amount: number): Promise<void> {
    const allLoans = await this.loanDb.getLoansByBorrower(borrowerAccountId);
    const loans = allLoans
      .filter((l) => !l.deletedAt)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    let remaining = amount;
    for (let i = loans.length - 1; i >= 0; i--) {
      if (remaining <= 0) break;
      const loan = loans[i]!;
      const room = loan.principal - loan.outstanding;
      if (room <= 0) continue;
      const addBack = Math.min(remaining, room);
      loan.outstanding += addBack;
      remaining -= addBack;
      loan.outstanding = Math.min(loan.outstanding, loan.principal);
      loan.status = loan.outstanding > 0 ? 'active' : 'settled';
      loan.updatedAt = new Date().toISOString();
      await this.loanDb.saveLoan(loan);
    }
  }

  async deleteLoan(loanId: string): Promise<void> {
    const txs = await this.db.getTransactions({ loanRef: loanId });
    for (const tx of txs) {
      await this.db.softDeleteTransaction(tx.id);
    }
    await this.loanDb.softDeleteLoan(loanId);
  }

  private _emptyReport(filter: LoanReportFilter): LoanReport {
    return {
      rows: [],
      summary: { totalLent: 0, totalRepaid: 0, outstanding: 0, transactionCount: 0, lenderName: '', borrowerName: '' },
      filter,
      generatedAt: new Date().toISOString(),
    };
  }

  async generateReport(filter: LoanReportFilter): Promise<LoanReport> {
    const txFilter: Record<string, string | number | undefined> = {};

    if (filter.borrowerAccountId) txFilter.accountId = filter.borrowerAccountId;
    if (filter.startDate) txFilter.startDate = filter.startDate;
    if (filter.endDate) txFilter.endDate = filter.endDate;

    if (filter.month && filter.month.includes('-')) {
      const [y, m] = filter.month.split('-');
      if (!y || !m) return this._emptyReport(filter);
      const monthNum = parseInt(m, 10);
      const start = `${y}-${String(monthNum).padStart(2, '0')}-01`;
      const endDate = new Date(parseInt(y, 10), monthNum, 0);
      txFilter.startDate = start;
      txFilter.endDate = endDate.toISOString().slice(0, 10);
    }

    const allSorted = sortLoanTransactions(await this.db.getTransactions(txFilter));
    const balanceMap = computeRunningBalances(allSorted);

    let displayTxs = allSorted;
    if (filter.type && filter.type !== 'all') {
      if (filter.type === 'lend') {
        displayTxs = displayTxs.filter((tx) => LOAN_CREDIT_TYPES.has(tx.type));
      } else {
        displayTxs = displayTxs.filter((tx) => LOAN_DEBIT_TYPES.has(tx.type));
      }
    }

    const accounts = await this.db.getAccounts();
    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    let totalLent = 0;
    let totalRepaid = 0;
    for (const tx of allSorted) {
      if (LOAN_CREDIT_TYPES.has(tx.type)) totalLent += tx.amount;
      if (LOAN_DEBIT_TYPES.has(tx.type)) totalRepaid += tx.amount;
    }

    const rows: LoanReportRow[] = displayTxs.map((tx) => {
      const isCredit = LOAN_CREDIT_TYPES.has(tx.type);
      const bal = balanceMap.get(tx.id) ?? 0;

      const srcAcct = tx.sourceAccount ? accountMap.get(tx.sourceAccount) : undefined;
      const dstAcct = tx.destAccount ? accountMap.get(tx.destAccount) : undefined;

      return {
        id: tx.id,
        date: tx.date,
        type: (isCredit ? 'lend' : 'repay') as 'lend' | 'repay',
        typeLabel: isCredit ? 'Lent' : 'Repayment',
        description: tx.description,
        lenderAccount: srcAcct?.name ?? (tx.sourceAccount ? '(deleted account)' : ''),
        borrowerAccount: dstAcct?.name ?? (tx.destAccount ? '(deleted account)' : ''),
        amount: tx.amount,
        runningBalance: bal,
      };
    });

    const borrowerAcct = filter.borrowerAccountId ? accountMap.get(filter.borrowerAccountId) : undefined;
    const lenderAccts = [...new Set(allSorted.map((tx) => tx.sourceAccount ?? '').filter(Boolean))];
    const lenderNames = lenderAccts.map((id) => accountMap.get(id)?.name ?? id);
    const lastTx = allSorted[allSorted.length - 1];
    const outstanding = lastTx ? balanceMap.get(lastTx.id) ?? 0 : 0;

    const summary: LoanReportSummary = {
      totalLent,
      totalRepaid,
      outstanding,
      transactionCount: rows.length,
      lenderName: lenderNames.join(', ') || 'All',
      borrowerName: borrowerAcct?.name ?? 'All Accounts',
    };

    return {
      rows,
      summary,
      filter,
      generatedAt: new Date().toISOString(),
    };
  }
}
