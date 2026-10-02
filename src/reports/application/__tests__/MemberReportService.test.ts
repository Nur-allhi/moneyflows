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
});
