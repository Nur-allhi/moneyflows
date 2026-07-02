import type { Database as SqlJsDb } from 'sql.js';
import type { Loan, LoanItem, LoanStack } from '../domain/types';

function now(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function rowToLoan(r: Record<string, unknown>): Loan {
  return {
    id: r.id as string,
    lenderAccountId: r.lender_account_id as string,
    borrowerAccountId: r.borrower_account_id as string,
    principal: r.principal as number,
    outstanding: r.outstanding as number,
    status: r.status as Loan['status'],
    description: (r.description as string) || '',
    metadata: JSON.parse((r.metadata as string) || '{}'),
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    deletedAt: r.deleted_at as string | undefined,
  };
}

export class LoanDatabase {
  private db: SqlJsDb;

  constructor(db: SqlJsDb) {
    this.db = db;
  }

  private run(sql: string, params?: Record<string, string | number | null>): void {
    this.db.run(sql, params as Parameters<SqlJsDb['run']>[1]);
  }

  private query<T>(sql: string, params?: Record<string, string | number | null>): T[] {
    const stmt = this.db.prepare(sql);
    if (params) stmt.bind(params as Parameters<typeof stmt.bind>[0]);
    const results: T[] = [];
    while (stmt.step()) results.push(stmt.getAsObject() as T);
    stmt.free();
    return results;
  }

  private queryOne<T>(sql: string, params?: Record<string, string | number | null>): T | null {
    const rows = this.query<T>(sql, params);
    return rows[0] ?? null;
  }

  async saveLoan(loan: Loan): Promise<void> {
    this.run(`INSERT INTO loans (id,lender_account_id,borrower_account_id,principal,outstanding,status,description,metadata,created_at,updated_at)
      VALUES ($id,$lender,$borrower,$principal,$out,$status,$desc,$meta,$created,$updated)
      ON CONFLICT(id) DO UPDATE SET lender_account_id=$lender,borrower_account_id=$borrower,
      principal=$principal,outstanding=$out,status=$status,description=$desc,metadata=$meta,updated_at=$updated`,
      { $id: loan.id, $lender: loan.lenderAccountId, $borrower: loan.borrowerAccountId,
        $principal: loan.principal, $out: loan.outstanding, $status: loan.status,
        $desc: loan.description, $meta: JSON.stringify(loan.metadata),
        $created: loan.createdAt, $updated: now() });
  }

  async getLoanById(id: string): Promise<Loan | null> {
    const r = this.queryOne<Record<string, unknown>>(
      'SELECT * FROM loans WHERE id=$id', { $id: id },
    );
    return r ? rowToLoan(r) : null;
  }

  async getLoansByBorrower(borrowerAccountId: string): Promise<Loan[]> {
    return this.query<Record<string, unknown>>(
      'SELECT * FROM loans WHERE borrower_account_id=$id AND deleted_at IS NULL',
      { $id: borrowerAccountId },
    ).map(rowToLoan);
  }

  async getLoansByLender(lenderAccountId: string): Promise<Loan[]> {
    return this.query<Record<string, unknown>>(
      'SELECT * FROM loans WHERE lender_account_id=$id AND deleted_at IS NULL',
      { $id: lenderAccountId },
    ).map(rowToLoan);
  }

  async getLoanStacks(): Promise<LoanStack[]> {
    const borrowerIds = this.query<{ borrower_account_id: string }>(
      "SELECT DISTINCT borrower_account_id FROM loans WHERE deleted_at IS NULL AND status='active'",
    );
    const accounts = this.query<Record<string, unknown>>(
      'SELECT id, name, type, member_id FROM accounts WHERE deleted_at IS NULL',
    );
    const accountMap = new Map(accounts.map((a) => [a.id as string, a]));

    const stacks: LoanStack[] = [];
    for (const row of borrowerIds) {
      const stack = await this._getStackForBorrower(row.borrower_account_id, accountMap);
      if (stack) stacks.push(stack);
    }
    return stacks;
  }

  async getLoanStackByBorrower(borrowerId: string): Promise<LoanStack | null> {
    const accounts = this.query<Record<string, unknown>>(
      'SELECT id, name, type, member_id FROM accounts WHERE deleted_at IS NULL',
    );
    const accountMap = new Map(accounts.map((a) => [a.id as string, a]));
    return this._getStackForBorrower(borrowerId, accountMap);
  }

  private async _getStackForBorrower(
    borrowerId: string,
    accountMap: Map<string, Record<string, unknown>>,
  ): Promise<LoanStack | null> {
    const loans = this.query<Record<string, unknown>>(
      'SELECT * FROM loans WHERE borrower_account_id=$cid AND deleted_at IS NULL',
      { $cid: borrowerId },
    ).map(rowToLoan);

    if (loans.length === 0) return null;

    const borrowerAcct = accountMap.get(borrowerId);
    let name = borrowerAcct?.name as string ?? 'Unknown';
    const stackType = borrowerAcct?.type === 'counterparty' ? 'external' : 'internal';

    const allAcctIds = new Set<string>();
    for (const l of loans) {
      allAcctIds.add(l.lenderAccountId);
      allAcctIds.add(l.borrowerAccountId);
    }

    const settledLoans: LoanItem[] = [];
    const activeLoanItems: LoanItem[] = [];
    let totalOutstanding = 0;

    for (const l of loans) {
      const outstanding = Math.max(0, l.outstanding);
      const recovered = l.principal - outstanding;
      let status: LoanItem['status'];
      if (l.status === 'settled') {
        status = 'settled';
      } else if (outstanding <= 0) {
        status = 'on_track';
      } else {
        status = 'active';
      }
      const lenderAcct = accountMap.get(l.lenderAccountId);
      const fundingName = lenderAcct?.name as string ?? l.lenderAccountId;
      const item: LoanItem = {
        id: l.id, fundingSource: fundingName,
        amount: l.principal, recovered, status, date: l.createdAt,
      };
      if (l.status === 'settled') {
        settledLoans.push(item);
      } else {
        activeLoanItems.push(item);
        totalOutstanding += outstanding;
      }
    }

    const totalActiveAmount = activeLoanItems.reduce((s, i) => s + i.amount, 0);
    const totalActiveRecovered = activeLoanItems.reduce((s, i) => s + i.recovered, 0);
    const isSettled = loans.length > 0 && loans.every((l) => l.status === 'settled');

    return {
      debtorId: borrowerId,
      debtorName: name,
      totalOutstanding,
      totalRecovered: totalActiveRecovered,
      progressPercent: totalActiveAmount > 0 ? Math.round((totalActiveRecovered / totalActiveAmount) * 100) : 0,
      settledCount: settledLoans.length,
      activeCount: activeLoanItems.length,
      loans: [...activeLoanItems, ...settledLoans],
      stackType,
      isSettled,
    };
  }

  async softDeleteLoan(id: string): Promise<void> {
    this.run('UPDATE loans SET deleted_at=$now,updated_at=$now WHERE id=$id',
      { $id: id, $now: now() });
  }
}
