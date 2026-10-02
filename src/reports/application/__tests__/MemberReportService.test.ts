import { describe, it, expect } from 'vitest';
import { Transaction } from '../../../core/domain/Transaction';
import { Account } from '../../../core/domain/Account';
import { Member } from '../../../core/domain/Member';
import type { IDatabaseService } from '../../../core/ports/IDatabaseService';
import { MemberReportService } from '../MemberReportService';

const MEMBER = new Member('member-1', 'Test Member');
const ACCT_A = new Account('acct-a', 'member-1', 'Cash', 'cash', 1100);
const ACCT_B = new Account('acct-b', 'member-1', 'Bank', 'bank', 300);

function tx(
  id: string,
  type: Transaction['type'],
  amount: number,
  date: string,
  sourceAccount?: string,
  destAccount?: string,
): Transaction {
  return new Transaction(id, type, `desc-${id}`, amount, 'member-1', `${date}T10:00:00.000Z`, sourceAccount, destAccount);
}

const ALL_TXS = [
  tx('t1', 'income', 1000, '2026-08-01', undefined, 'acct-a'),
  tx('t2', 'expense', 200, '2026-08-02', 'acct-a', undefined),
  tx('t3', 'transfer', 300, '2026-08-03', 'acct-a', 'acct-b'),
];

function makeService(txs: Transaction[] = ALL_TXS): MemberReportService {
  const db = {
    getMemberById: async (id: string) => (id === MEMBER.id ? MEMBER : null),
    getAccounts: async (memberId?: string) =>
      memberId === MEMBER.id ? [ACCT_A, ACCT_B] : [],
    getTransactions: async () => txs,
  } as unknown as IDatabaseService;
  return new MemberReportService(db);
}

describe('MemberReportService (T-132 accounts section)', () => {
  it('covers every account with closing pinned to live balance', async () => {
    const report = await makeService().generateReport({ memberId: 'member-1' });

    expect(report.accounts.map((a) => a.accountName)).toEqual(['Cash', 'Bank']);
    const cash = report.accounts[0]!;
    const bank = report.accounts[1]!;
    // Cash: +1000 -200 -300 = +500 net; balance 1100 → opening 600
    expect(cash.opening).toBe(600);
    expect(cash.totalCredit).toBe(1000);
    expect(cash.totalDebit).toBe(500);
    expect(cash.closing).toBe(1100);
    expect(cash.rows.map((r) => r.runningBalance)).toEqual([1600, 1400, 1100]);
    // Bank: +300 transfer in; balance 300 → opening 0
    expect(bank.opening).toBe(0);
    expect(bank.rows.map((r) => r.runningBalance)).toEqual([300]);
    expect(bank.rows[0]!.counterpartyAccount).toBe('Cash');
    // Summary closes at the sum of live balances
    expect(report.summary.closing).toBe(1400);
    expect(report.summary.transactionCount).toBe(4);
    expect(report.summary.accountCount).toBe(2);
  });

  it('derives correct running balances when display is date-filtered (full-history rule)', async () => {
    const report = await makeService().generateReport({
      memberId: 'member-1',
      startDate: '2026-08-03',
    });

    const cash = report.accounts[0]!;
    // Only the transfer is shown, but its balance carries the earlier +1000/-200
    expect(cash.rows.map((r) => r.id)).toEqual(['t3']);
    expect(cash.rows[0]!.runningBalance).toBe(1100);
    expect(cash.opening).toBe(1400);
    const bank = report.accounts[1]!;
    expect(bank.rows[0]!.runningBalance).toBe(300);
  });

  it('restricts sections with accountIds', async () => {
    const report = await makeService().generateReport({
      memberId: 'member-1',
      accountIds: ['acct-b'],
    });

    expect(report.accounts.map((a) => a.accountId)).toEqual(['acct-b']);
    expect(report.summary.closing).toBe(300);
  });

  it('throws for an unknown member', async () => {
    await expect(makeService().generateReport({ memberId: 'nope' })).rejects.toThrow(
      'Member nope not found',
    );
  });

  it('returns empty loan/other sections unless requested', async () => {
    const report = await makeService().generateReport({ memberId: 'member-1' });
    expect(report.loans).toEqual([]);
    expect(report.otherLedgers).toEqual([]);
  });
});

const ACCT_X = new Account('acct-x', '', 'Home EXP', 'cash', 8000);

const LOAN_TXS = [
  tx('l1', 'lend', 5000, '2026-08-01', 'acct-a', 'acct-x'),
  tx('l2', 'lend', 7000, '2026-08-02', 'acct-a', 'acct-x'),
  tx('l3', 'repay', 4000, '2026-08-04', 'acct-x', 'acct-a'),
];

function makeFullService(): MemberReportService {
  const db = {
    getMemberById: async (id: string) => (id === MEMBER.id ? MEMBER : null),
    getAccounts: async (memberId?: string) =>
      memberId === MEMBER.id ? [ACCT_A, ACCT_B] : [ACCT_A, ACCT_B, ACCT_X],
    getTransactions: async () => [...ALL_TXS, ...LOAN_TXS],
    getOtherLedgers: async () => [LEDGER],
    getOtherLedgerEntries: async () => [...ENTRIES],
  } as unknown as IDatabaseService;
  return new MemberReportService(db);
}

const LEDGER = {
  id: 'led-1',
  name: 'Shop Book',
  ownerType: 'member' as const,
  ownerMemberId: 'member-1',
  startingDate: '2026-08-01',
  openingBalance: 100,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

function entry(id: string, date: string, debit: number, credit: number) {
  return {
    id,
    ledgerId: 'led-1',
    date,
    description: `entry-${id}`,
    debit,
    credit,
    balance: 0,
    metadata: {},
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
  };
}

const ENTRIES = [entry('e1', '2026-08-02', 30, 0), entry('e2', '2026-08-03', 0, 50)];

describe('MemberReportService (T-133 loans + other ledgers)', () => {
  it('groups loans by counterparty with full-history balances', async () => {
    const report = await makeFullService().generateReport({
      memberId: 'member-1',
      includeLoans: true,
      includeOtherLedgers: true,
    });

    expect(report.loans.map((s) => s.counterpartyName)).toEqual(['Home EXP']);
    const sec = report.loans[0]!;
    expect(sec.totalLent).toBe(12000);
    expect(sec.totalRepaid).toBe(4000);
    expect(sec.outstanding).toBe(8000);
    expect(sec.rows.map((r) => r.runningBalance)).toEqual([5000, 12000, 8000]);
    expect(sec.rows[0]!.counterpartyAccount).toBe('Cash');

    const book = report.otherLedgers[0]!;
    expect(book.ledgerName).toBe('Shop Book');
    expect(book.opening).toBe(100);
    expect(book.totalDebit).toBe(30);
    expect(book.totalCredit).toBe(50);
    expect(book.closing).toBe(120);
    expect(book.rows.map((r) => r.runningBalance)).toEqual([70, 120]);
  });

  it('trims loan/other rows by period but keeps full-history balances', async () => {
    const report = await makeFullService().generateReport({
      memberId: 'member-1',
      startDate: '2026-08-04',
      includeLoans: true,
      includeOtherLedgers: true,
    });

    const sec = report.loans[0]!;
    expect(sec.rows.map((r) => r.id)).toEqual(['l3']);
    expect(sec.rows[0]!.runningBalance).toBe(8000);
    expect(sec.outstanding).toBe(8000);
    expect(report.otherLedgers[0]!.rows).toEqual([]);
  });
});
