import { describe, expect, it, vi } from 'vitest';
import type { IDatabaseService } from '../../../core/ports/IDatabaseService';
import { SQLiteDatabaseService } from '../../../infrastructure/database/SQLiteDatabaseService';
import { LoanService } from '../../application/LoanService';
import type { Loan } from '../../domain/types';
import { LoanDatabase } from '../LoanDatabase';

/**
 * BUG-46: loan statements go straight into the raw sql.js database, which the
 * owning service only persists when it knows something changed. A loan write
 * that does not announce itself is dropped on the next reload — observed live as
 * an accepted edit that moved the ledger and left the loan record behind.
 *
 * These tests pin the two halves of the contract: `LoanDatabase` announces every
 * write, and `LoanService` wires that announcement to the service's dirty flag.
 */
const loan = (): Loan => ({
  id: 'loan-1', lenderAccountId: 'acct-bank', borrowerAccountId: 'acct-home',
  principal: 10000, outstanding: 6000, status: 'active', description: '',
  metadata: {}, createdAt: '2026-01-01 00:00:00', updatedAt: '2026-01-01 00:00:00',
});

/** A raw sql.js stand-in: these two tests only exercise the write path. */
function fakeRaw(): { run: ReturnType<typeof vi.fn> } {
  return { run: vi.fn() };
}

describe('loan writes announce themselves (BUG-46)', () => {
  it('calls onWrite after a loan write', () => {
    const onWrite = vi.fn();
    const db = new LoanDatabase(fakeRaw() as never, onWrite);

    db.saveLoan(loan());

    expect(onWrite).toHaveBeenCalledTimes(1);
  });

  it('still writes when no owner asked to be told', () => {
    const raw = fakeRaw();
    const db = new LoanDatabase(raw as never);

    db.saveLoan(loan());

    expect(raw.run).toHaveBeenCalledTimes(1);
  });

  it('marks the service dirty through the wiring LoanService sets up', () => {
    const raw = fakeRaw();
    const markDirty = vi.fn();
    const db = Object.create(SQLiteDatabaseService.prototype) as IDatabaseService & {
      getSqlJsDb: () => unknown;
      markDirty: () => void;
    };
    db.getSqlJsDb = () => raw;
    db.markDirty = markDirty;

    const service = new LoanService(db as unknown as IDatabaseService);
    const loanDb = (service as unknown as { loanDb: LoanDatabase }).loanDb;

    expect(markDirty).not.toHaveBeenCalled();
    loanDb.saveLoan(loan());
    expect(markDirty).toHaveBeenCalledTimes(1);
    expect(raw.run).toHaveBeenCalledTimes(1);
  });
});
