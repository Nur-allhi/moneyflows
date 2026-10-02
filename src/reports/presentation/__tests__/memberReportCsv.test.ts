import { describe, it, expect } from 'vitest';
import type { MemberReport } from '../../domain/types';
import { memberReportCsv } from '../memberReportCsv';

function row(id: string, description: string, debit: number, credit: number, balance: number) {
  return {
    id,
    date: '2026-08-02T10:00:00.000Z',
    type: 'income',
    typeLabel: 'Income',
    description,
    debit,
    credit,
    runningBalance: balance,
    counterpartyAccount: '',
  };
}

const REPORT: MemberReport = {
  summary: {
    memberId: 'm1', memberName: 'Test Member', periodStart: '', periodEnd: '',
    opening: 0, totalDebit: 0, totalCredit: 0, closing: 0,
    transactionCount: 0, accountCount: 1,
  },
  accounts: [
    {
      accountId: 'a', accountName: 'Cash', opening: 0,
      totalDebit: 0, totalCredit: 100, closing: 100,
      rows: [
        row('t1', 'Salary, August', 0, 100, 100),
        row('t2', 'Say "hi"', 0, 50, 150),
      ],
    },
  ],
  loans: [],
  otherLedgers: [],
  filter: { memberId: 'm1' },
  generatedAt: '2026-08-01T00:00:00.000Z',
};

describe('memberReportCsv (T-135)', () => {
  it('starts with a BOM + header and quotes commas/quotes', () => {
    const csv = memberReportCsv(REPORT);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const lines = csv.slice(1).trim().split('\n');
    expect(lines[0]).toBe('Section,Account,Date,Type,Description,Debit,Credit,Balance');
    expect(lines[1]).toBe('Account,Cash,2026-08-02,Income,"Salary, August",,100,100');
    expect(lines[2]).toBe('Account,Cash,2026-08-02,Income,"Say ""hi""",,50,150');
  });
});
