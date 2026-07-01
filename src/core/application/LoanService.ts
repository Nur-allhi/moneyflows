import { v4 as uuidv4 } from 'uuid';
import { Loan } from '../domain/Loan';
import { Transaction } from '../domain/Transaction';
import { Account } from '../domain/Account';
import type { IDatabaseService } from '../ports/IDatabaseService';
import type { LoanDirection } from '../domain/Loan';

export interface CreateGivenLoanParams {
  sourceAccount: string;
  destAccount: string;
  amount: number;
  description: string;
  date: string;
  memberId: string;
}

export interface CreateReceivedLoanParams {
  sourceAccount: string;
  destAccount: string;
  amount: number;
  description: string;
  date: string;
  memberId: string;
}

export interface RecordRepaymentParams {
  sourceAccount: string;
  destAccount: string;
  amount: number;
  loanRef: string;
  description: string;
  date: string;
  memberId: string;
}

export interface RecordPaybackParams {
  sourceAccount: string;
  destAccount: string;
  amount: number;
  loanRef: string;
  description: string;
  date: string;
  memberId: string;
}

export interface CreateCounterpartyResult {
  account: Account;
}

export class LoanService {
  constructor(private db: IDatabaseService) {}

  async createGivenLoan(params: CreateGivenLoanParams): Promise<{ loan: Loan; tx: Transaction }> {
    const now = new Date().toISOString();
    const [y, m, d] = params.date.split('-');
    const dateTime = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0).toISOString();

    const loan = new Loan(
      uuidv4(), 'given', params.destAccount, params.amount, params.amount,
      'active', params.description, {}, now, now,
    );

    const tx = new Transaction(
      uuidv4(), 'loan_issue', params.description, params.amount,
      params.memberId, dateTime, params.sourceAccount, params.destAccount,
      undefined, loan.id, {}, now, now,
    );

    await this.db.saveLoan(loan);
    await this.db.saveTransaction(tx);
    return { loan, tx };
  }

  async createReceivedLoan(params: CreateReceivedLoanParams): Promise<{ loan: Loan; tx: Transaction }> {
    const now = new Date().toISOString();
    const [y, m, d] = params.date.split('-');
    const dateTime = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0).toISOString();

    const loan = new Loan(
      uuidv4(), 'received', params.sourceAccount, params.amount, params.amount,
      'active', params.description, {}, now, now,
    );

    const tx = new Transaction(
      uuidv4(), 'loan_received', params.description, params.amount,
      params.memberId, dateTime, params.sourceAccount, params.destAccount,
      undefined, loan.id, {}, now, now,
    );

    await this.db.saveLoan(loan);
    await this.db.saveTransaction(tx);
    return { loan, tx };
  }

  async recordRepayment(params: RecordRepaymentParams): Promise<{ tx: Transaction }> {
    const now = new Date().toISOString();
    const [y, m, d] = params.date.split('-');
    const dateTime = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0).toISOString();

    const tx = new Transaction(
      uuidv4(), 'loan_repayment', params.description, params.amount,
      params.memberId, dateTime, params.sourceAccount, params.destAccount,
      undefined, params.loanRef, {}, now, now,
    );

    await this.db.saveTransaction(tx);
    const counterpartyId = params.loanRef ? undefined : params.sourceAccount;
    await this._updateLoanOutstanding(params.loanRef, counterpartyId);
    return { tx };
  }

  async recordPayback(params: RecordPaybackParams): Promise<{ tx: Transaction }> {
    const now = new Date().toISOString();
    const [y, m, d] = params.date.split('-');
    const dateTime = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0).toISOString();

    const tx = new Transaction(
      uuidv4(), 'loan_paidback', params.description, params.amount,
      params.memberId, dateTime, params.sourceAccount, params.destAccount,
      undefined, params.loanRef, {}, now, now,
    );

    await this.db.saveTransaction(tx);
    const counterpartyId = params.loanRef ? undefined : params.destAccount;
    await this._updateLoanOutstanding(params.loanRef, counterpartyId);
    return { tx };
  }

  private async _updateLoanOutstanding(loanRef: string, counterpartyId?: string): Promise<void> {
    if (loanRef) {
      const loan = await this.db.getLoanById(loanRef);
      if (loan) await this._recalculateLoan(loan);
    } else if (counterpartyId) {
      const loans = await this.db.getLoansByCounterparty(counterpartyId);
      for (const loan of loans) {
        await this._recalculateLoan(loan, counterpartyId);
      }
    }
  }

  private async _recalculateLoan(loan: Loan, counterpartyId?: string): Promise<void> {
    const cpId = counterpartyId || loan.counterpartyId;
    const issues = await this.db.getTransactions({ loanRef: loan.id, type: 'loan_issue' });
    const received = await this.db.getTransactions({ loanRef: loan.id, type: 'loan_received' });
    const repayments = await this.db.getTransactions({ accountId: cpId, type: 'loan_repayment' });
    const paybacks = await this.db.getTransactions({ accountId: cpId, type: 'loan_paidback' });

    if (loan.direction === 'given') {
      const issued = issues.reduce((s, t) => s + t.amount, 0);
      const repaid = repayments.reduce((s, t) => s + t.amount, 0);
      loan.outstanding = issued - repaid;
    } else {
      const taken = received.reduce((s, t) => s + t.amount, 0);
      const paid = paybacks.reduce((s, t) => s + t.amount, 0);
      loan.outstanding = taken - paid;
    }

    if (loan.outstanding <= 0) {
      loan.outstanding = 0;
      loan.status = 'settled';
    }

    await this.db.saveLoan(loan);
  }

  async getLoans(direction?: LoanDirection): Promise<Loan[]> {
    return this.db.getLoans(direction);
  }

  async getLoanStacks(): Promise<import('../domain/Loan').LoanStack[]> {
    return this.db.getLoanStacks();
  }

  async deleteLoanStack(counterpartyId: string): Promise<void> {
    const loans = await this.db.getLoansByCounterparty(counterpartyId);
    for (const loan of loans) {
      const txs = await this.db.getTransactions({ loanRef: loan.id });
      for (const tx of txs) {
        await this.db.softDeleteTransaction(tx.id);
      }
      await this.db.softDeleteLoan(loan.id);
    }
  }

  async createCounterparty(
    name: string, type: 'debtor' | 'creditor',
  ): Promise<CreateCounterpartyResult> {
    const now = new Date().toISOString();
    const account = new Account(
      uuidv4(), undefined, name,
      'counterparty', 0, 'BDT', undefined, undefined, true,
      { counterpartyType: type }, now, now,
    );

    await this.db.saveAccount(account);
    return { account };
  }
}