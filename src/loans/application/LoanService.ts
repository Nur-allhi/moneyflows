import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '../../core/domain/Transaction';
import { Account } from '../../core/domain/Account';
import type { IDatabaseService } from '../../core/ports/IDatabaseService';
import type { Loan, LoanStack } from '../domain/types';
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
    loanId: string;
    amount: number;
    description: string;
    date: string;
    memberId: string;
  }): Promise<{ tx: Transaction }> {
    if (!params.loanId) throw new Error('loanId is required for repayment');

    const loan = await this.loanDb.getLoanById(params.loanId);
    if (!loan) throw new Error(`Loan ${params.loanId} not found`);
    if (loan.status === 'settled') throw new Error('Loan is already settled');

    const now = new Date();
    const nowStr = now.toISOString();
    const [y, m, d] = params.date.split('-');
    const dateTime = new Date(Number(y), Number(m) - 1, Number(d), now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();

    const tx = new Transaction(
      uuidv4(), 'repay', params.description, params.amount,
      params.memberId, dateTime, loan.borrowerAccountId, loan.lenderAccountId,
      undefined, loan.id, {}, nowStr, nowStr,
    );

    loan.outstanding -= params.amount;
    if (loan.outstanding <= 0) {
      loan.outstanding = 0;
      loan.status = 'settled';
    }
    loan.updatedAt = nowStr;

    await this.loanDb.saveLoan(loan);
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

  async settleLoan(loanId: string): Promise<void> {
    const loan = await this.loanDb.getLoanById(loanId);
    if (!loan) throw new Error(`Loan ${loanId} not found`);
    loan.outstanding = 0;
    loan.status = 'settled';
    loan.updatedAt = new Date().toISOString();
    await this.loanDb.saveLoan(loan);
  }

  async deleteLoan(loanId: string): Promise<void> {
    const txs = await this.db.getTransactions({ loanRef: loanId });
    for (const tx of txs) {
      await this.db.softDeleteTransaction(tx.id);
    }
    await this.loanDb.softDeleteLoan(loanId);
  }
}
