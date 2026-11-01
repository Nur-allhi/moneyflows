import type { Database as SqlJsDb } from 'sql.js';
import type { Loan, LoanItem, LoanStack, LenderBreakdown } from '../domain/types';
import { getStackDisplayName } from '../domain/loanDisplay';
import { loanItemStatus, splitStack, stackIsSettled } from '../domain/loanStatus';

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

/**
 * Per-lender exposure for one borrower's loans: groups active loans by
 * lender account (ID, not name — duplicate names exist), highest
 * outstanding first. Pure for unit testing.
 */
export function buildLenderBreakdown(loans: Loan[]): LenderBreakdown[] {
  const byLender = new Map<string, LenderBreakdown>();
  for (const l of loans) {
    if (l.status === 'settled' || l.deletedAt) continue;
    const outstanding = Math.max(0, l.outstanding);
    if (outstanding <= 0) continue;
    const entry = byLender.get(l.lenderAccountId) ?? {
      lenderAccountId: l.lenderAccountId, lent: 0, outstanding: 0, activeLoanCount: 0,
    };
    entry.lent += l.principal;
    entry.outstanding += outstanding;
    entry.activeLoanCount += 1;
    byLender.set(l.lenderAccountId, entry);
  }
  return [...byLender.values()].sort((a, b) => b.outstanding - a.outstanding);
}

/**
 * Lifetime totals for one borrower's stack — **every** loan, settled or not.
 *
 * BUG-27: these used to be computed over the active loans only, so a borrower who
 * had fully repaid an older loan and then taken a new one showed ~0% progress next
 * to the money left on the new loan. Progress has to read as
 * (repaid / ever borrowed); that also keeps it consistent with `totalOutstanding`,
 * which is the money left: remaining + repaid = lent. Pure for unit testing.
 */
export function stackTotals(loans: Loan[]): {
  totalAmount: number;
  totalRecovered: number;
  progressPercent: number;
} {
  let totalAmount = 0;
  let totalRecovered = 0;
  for (const l of loans) {
    totalAmount += l.principal;
    totalRecovered += l.principal - Math.max(0, l.outstanding);
  }
  return {
    totalAmount,
    totalRecovered,
    progressPercent: totalAmount > 0 ? Math.round((totalRecovered / totalAmount) * 100) : 0,
  };
}

export class LoanDatabase {
  private db: SqlJsDb;
  private onWrite?: () => void;

  /**
   * `onWrite` is called after every write, and exists because these statements go
   * straight into the raw sql.js database: the owning service only persists what
   * it knows is dirty, so a loan write that does not announce itself can be
   * discarded on reload (BUG-46). `LoanService` wires it to
   * `SQLiteDatabaseService.markDirty()`.
   */
  constructor(db: SqlJsDb, onWrite?: () => void) {
    this.db = db;
    this.onWrite = onWrite;
  }

  private run(sql: string, params?: Record<string, string | number | null>): void {
    this.db.run(sql, params as Parameters<SqlJsDb['run']>[1]);
    this.onWrite?.();
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
      'SELECT DISTINCT borrower_account_id FROM loans WHERE deleted_at IS NULL',
    );
    const accounts = this.query<Record<string, unknown>>(
      'SELECT id, name, type, member_id FROM accounts WHERE deleted_at IS NULL',
    );
    const accountMap = new Map(accounts.map((a) => [a.id as string, a]));
    const members = this.query<{ id: string; name: string }>(
      'SELECT id, name FROM members WHERE deleted_at IS NULL',
    );
    const memberMap = new Map(members.map((m) => [m.id, m.name]));

    const stacks: LoanStack[] = [];
    for (const row of borrowerIds) {
      const stack = await this._getStackForBorrower(row.borrower_account_id, accountMap, memberMap);
      if (stack) stacks.push(stack);
    }
    return stacks;
  }

  async getLoanStackByBorrower(borrowerId: string): Promise<LoanStack | null> {
    const accounts = this.query<Record<string, unknown>>(
      'SELECT id, name, type, member_id FROM accounts WHERE deleted_at IS NULL',
    );
    const accountMap = new Map(accounts.map((a) => [a.id as string, a]));
    const members = this.query<{ id: string; name: string }>(
      'SELECT id, name FROM members WHERE deleted_at IS NULL',
    );
    const memberMap = new Map(members.map((m) => [m.id, m.name]));
    return this._getStackForBorrower(borrowerId, accountMap, memberMap);
  }

  private async _getStackForBorrower(
    borrowerId: string,
    accountMap: Map<string, Record<string, unknown>>,
    memberMap: Map<string, string>,
  ): Promise<LoanStack | null> {
    const loans = this.query<Record<string, unknown>>(
      'SELECT * FROM loans WHERE borrower_account_id=$cid AND deleted_at IS NULL',
      { $cid: borrowerId },
    ).map(rowToLoan);

    if (loans.length === 0) return null;

    const borrowerAcct = accountMap.get(borrowerId);
    const acctName = (borrowerAcct?.name as string ?? '(deleted account)');
    const borrowerType = borrowerAcct?.type as string | undefined;
    const memberId = borrowerAcct?.member_id as string | undefined;
    const stackType = borrowerType === 'counterparty' ? 'external' : 'internal';
    const name = borrowerAcct
      ? getStackDisplayName(acctName, borrowerType, memberId ? memberMap.get(memberId) : undefined)
      : acctName;

    const allAcctIds = new Set<string>();
    for (const l of loans) {
      allAcctIds.add(l.lenderAccountId);
      allAcctIds.add(l.borrowerAccountId);
    }

    // BUG-45: the split asks "is anything still owed?" (loanStatus), not the raw
    // flag — one definition for the count, the filters and the label.
    const split = splitStack(loans, (l): LoanItem => {
      const outstanding = Math.max(0, l.outstanding);
      const lenderAcct = accountMap.get(l.lenderAccountId);
      return {
        id: l.id,
        fundingSource: lenderAcct?.name as string ?? l.lenderAccountId,
        amount: l.principal,
        recovered: l.principal - outstanding,
        status: loanItemStatus(l),
        date: l.createdAt,
      };
    });

    // Stack-wide (settled loans included) — see stackTotals (BUG-27).
    const totals = stackTotals(loans);
    const isSettled = stackIsSettled(loans);

    return {
      debtorId: borrowerId,
      debtorName: name,
      totalOutstanding: split.totalOutstanding,
      totalRecovered: totals.totalRecovered,
      progressPercent: totals.progressPercent,
      settledCount: split.finished.length,
      activeCount: split.running.length,
      loans: [...split.running, ...split.finished],
      lenderBreakdown: buildLenderBreakdown(loans),
      stackType,
      isSettled,
    };
  }

  async softDeleteLoan(id: string): Promise<void> {
    this.run('UPDATE loans SET deleted_at=$now,updated_at=$now WHERE id=$id',
      { $id: id, $now: now() });
  }
}
