import { formatAmount } from '../../../presentation/utils/format';
import { shortDate } from '../../../presentation/constants/dates';
import type { MemberReportRow } from '../../domain/types';
import styles from './MemberReportScreen.module.css';

interface PrintTableProps {
  rows: MemberReportRow[];
  locale: string;
  currency: string;
  testId: string;
}

/**
 * Full (non-virtualized) table rendered ONLY in print. The on-screen
 * LedgerTable virtualizes rows, so it cannot print complete ledgers —
 * this mirrors the PDF column layout instead.
 */
export function ReportPrintTable({ rows, locale, currency, testId }: PrintTableProps) {
  if (rows.length === 0) return null;
  return (
    <table className={styles.printTable} data-testid={testId}>
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Description</th>
          <th>Debit</th>
          <th>Credit</th>
          <th>Balance</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>{shortDate(r.date, locale)}</td>
            <td>{r.typeLabel}</td>
            <td>{r.counterpartyAccount ? `${r.description} (${r.counterpartyAccount})` : r.description}</td>
            <td>{r.debit > 0 ? formatAmount(r.debit, locale, currency) : ''}</td>
            <td>{r.credit > 0 ? formatAmount(r.credit, locale, currency) : ''}</td>
            <td>{formatAmount(r.runningBalance, locale, currency)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
