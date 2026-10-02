import type { MemberReport } from '../domain/types';

function esc(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Spreadsheet-friendly CSV (T-135): one row per report line with Section /
 * Account columns so Excel/Sheets can pivot. Amounts are raw numbers with
 * `.` decimals (parseable); dates are YYYY-MM-DD. Starts with a BOM so
 * Excel detects UTF-8.
 */
export function memberReportCsv(report: MemberReport): string {
  const lines = ['Section,Account,Date,Type,Description,Debit,Credit,Balance'];
  const push = (
    section: string,
    account: string,
    r: { date: string; typeLabel: string; description: string; debit: number; credit: number; runningBalance: number },
  ): void => {
    lines.push(
      [
        esc(section),
        esc(account),
        esc(r.date.slice(0, 10)),
        esc(r.typeLabel),
        esc(r.description),
        esc(r.debit === 0 ? '' : r.debit),
        esc(r.credit === 0 ? '' : r.credit),
        esc(r.runningBalance),
      ].join(','),
    );
  };
  for (const a of report.accounts) {
    for (const r of a.rows) push('Account', a.accountName, r);
  }
  for (const l of report.loans) {
    for (const r of l.rows) push('Loan', l.counterpartyName, r);
  }
  for (const l of report.otherLedgers) {
    for (const r of l.rows) push('Other Ledger', l.ledgerName, r);
  }
  return '\uFEFF' + lines.join('\n') + '\n';
}

export function downloadMemberReportCsv(report: MemberReport): void {
  const safe = report.summary.memberName.replace(/\s+/g, '_').toLowerCase() || 'report';
  const blob = new Blob([memberReportCsv(report)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Member_${safe}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
