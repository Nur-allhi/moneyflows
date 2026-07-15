import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '../../core/domain/Transaction';
import { Account } from '../../core/domain/Account';
import type { IDatabaseService } from '../../core/ports/IDatabaseService';
import type { Loan, LoanStack, LoanReport, LoanReportFilter, LoanReportRow, LoanReportSummary } from '../domain/types';
import { LoanDatabase } from '../infrastructure/LoanDatabase';
import { SQLiteDatabaseService } from '../../infrastructure/database/SQLiteDatabaseService';

export class LoanService {
  private db: IDatabaseService;
  private loanDb: LoanDatabase;

  constructor(db: IDatabaseService) {
    this.db = db;
    if (db instanceof SQLiteDatabaseService) {
      const raw = db.getSqlJsDb();
      if (!raw) throw new Error('Database not initialized');
      this.loanDb = new LoanDatabase(raw);
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
  }): Promise<{ tx: Transaction }> {
    if (!params.borrowerAccountId) throw new Error('borrowerAccountId is required for repayment');

    const allLoans = await this.loanDb.getLoansByBorrower(params.borrowerAccountId);
    const activeLoans = allLoans.filter((l) => l.status !== 'settled' && l.outstanding > 0);
    if (activeLoans.length === 0) throw new Error('No active loans found for this counterparty');

    const now = new Date();
    const nowStr = now.toISOString();
    const [y, m, d] = params.date.split('-');
    const dateTime = new Date(Number(y), Number(m) - 1, Number(d), now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();

    const firstLoan = activeLoans[0]!;
    const dst = params.destinationAccountId ?? firstLoan.lenderAccountId;

    let remaining = params.amount;
    const sorted = [...activeLoans].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    for (const loan of sorted) {
      if (remaining <= 0) break;
      if (loan.outstanding <= 0) continue;

      const applied = Math.min(remaining, loan.outstanding);
      loan.outstanding -= applied;
      remaining -= applied;

      if (loan.outstanding <= 0) {
        loan.outstanding = 0;
        loan.status = 'settled';
      }
      loan.updatedAt = nowStr;
      await this.loanDb.saveLoan(loan);
    }

    const tx = new Transaction(
      uuidv4(), 'repay', params.description, params.amount,
      params.memberId, dateTime, params.borrowerAccountId, dst,
      undefined, undefined, {}, nowStr, nowStr,
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

  async syncLoanTransaction(loanRef: string | undefined, oldAmount: number, newAmount: number, txType: string): Promise<void> {
    if (!loanRef) return;
    const loan = await this.loanDb.getLoanById(loanRef);
    if (!loan) return;
    const diff = newAmount - oldAmount;
    if (txType === 'lend') {
      loan.principal += diff;
      loan.outstanding += diff;
    } else if (txType === 'repay') {
      loan.outstanding -= diff;
    }
    loan.outstanding = Math.max(0, loan.outstanding);
    loan.status = loan.outstanding <= 0 ? 'settled' : 'active';
    loan.updatedAt = new Date().toISOString();
    await this.loanDb.saveLoan(loan);
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

    let txs = await this.db.getTransactions(txFilter);
    const loanTypes = new Set(['lend', 'repay', 'loan_issue', 'loan_repayment', 'loan_received', 'loan_paidback']);

    txs = txs.filter((tx) => loanTypes.has(tx.type));

    if (filter.type && filter.type !== 'all') {
      if (filter.type === 'lend') {
        txs = txs.filter((tx) => tx.type === 'lend' || tx.type === 'loan_issue' || tx.type === 'loan_received');
      } else {
        txs = txs.filter((tx) => tx.type === 'repay' || tx.type === 'loan_repayment' || tx.type === 'loan_paidback');
      }
    }

    const accounts = await this.db.getAccounts();
    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    const sorted = [...txs].sort((a, b) => {
      const c = a.date.localeCompare(b.date);
      if (c !== 0) return c;
      return (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
    });

    let running = 0;
    let totalLent = 0;
    let totalRepaid = 0;

    const rows: LoanReportRow[] = sorted.map((tx) => {
      const isCredit = tx.type === 'lend' || tx.type === 'loan_issue' || tx.type === 'loan_received';
      const isDebit = tx.type === 'repay' || tx.type === 'loan_repayment' || tx.type === 'loan_paidback';

      if (isCredit) { running += tx.amount; totalLent += tx.amount; }
      if (isDebit) { running -= tx.amount; totalRepaid += tx.amount; }

      const srcAcct = tx.sourceAccount ? accountMap.get(tx.sourceAccount) : undefined;
      const dstAcct = tx.destAccount ? accountMap.get(tx.destAccount) : undefined;

      return {
        id: tx.id,
        date: tx.date,
        type: (isCredit ? 'lend' : 'repay') as 'lend' | 'repay',
        typeLabel: tx.type === 'lend' || tx.type === 'loan_issue' ? 'Lent' :
                   tx.type === 'loan_received' ? 'Received' :
                   tx.type === 'repay' || tx.type === 'loan_repayment' ? 'Repayment' : 'Paid Back',
        description: tx.description,
        lenderAccount: srcAcct?.name ?? tx.sourceAccount ?? '',
        borrowerAccount: dstAcct?.name ?? tx.destAccount ?? '',
        amount: tx.amount,
        runningBalance: running,
      };
    });

    const borrowerAcct = filter.borrowerAccountId ? accountMap.get(filter.borrowerAccountId) : undefined;
    const lenderAccts = [...new Set(txs.map((tx) => tx.sourceAccount ?? '').filter(Boolean))];
    const lenderNames = lenderAccts.map((id) => accountMap.get(id)?.name ?? id);

    const summary: LoanReportSummary = {
      totalLent,
      totalRepaid,
      outstanding: running,
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
