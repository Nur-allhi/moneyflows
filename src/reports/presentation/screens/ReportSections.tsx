import { LedgerTable } from '../../../presentation/components';
import type { LedgerRow } from '../../../presentation/components';
import { formatAmountParts } from '../../../presentation/utils/format';
import { shortDate } from '../../../presentation/constants/dates';
import type { MemberReport, MemberReportRow } from '../../domain/types';
import { ReportPrintTable } from './ReportPrintTable';
import styles from './MemberReportScreen.module.css';

function toLedgerRows(rows: MemberReportRow[], locale: string, currency: string): LedgerRow[] {
  return rows.map((r) => {
    const incomeLike = r.credit > 0 && (r.type === 'income' || r.type === 'credit');
    const loanLike = r.type === 'lend' || r.type === 'repay';
    return {
      id: r.id,
      date: shortDate(r.date, locale),
      description: r.counterpartyAccount ? `${r.description} (${r.counterpartyAccount})` : r.description,
      debit: r.debit > 0 ? formatAmountParts(r.debit, locale, currency).amount : '—',
      credit: r.credit > 0 ? formatAmountParts(r.credit, locale, currency).amount : '—',
      balance: formatAmountParts(r.runningBalance, locale, currency).amount,
      currencyLabel: currency,
      type: incomeLike ? 'income' : loanLike ? 'loan' : r.debit > 0 && r.type !== 'transfer' && r.type !== 'lend' ? 'expense' : 'transfer',
    } as LedgerRow;
  });
}

interface ReportSectionsProps {
  report: MemberReport;
  locale: string;
  currency: string;
  isDesktop: boolean;
  money: (n: number) => string;
}

export function ReportSections({ report, locale, currency, isDesktop, money }: ReportSectionsProps) {
  return (
    <>
      {report.accounts.map((a) => (
        <section key={a.accountId} className={styles.section}>
          <h2 className={styles.sectionTitle}>{a.accountName}</h2>
          <p className={styles.sectionSub}>
            Opening {money(a.opening)} · Closing {money(a.closing)}
          </p>
          {a.rows.length > 0 ? (
            <>
              <div className={styles.screenTable} data-testid="report-screen-table">
                <LedgerTable rows={toLedgerRows(a.rows, locale, currency)} desktop={isDesktop} />
              </div>
              <ReportPrintTable rows={a.rows} locale={locale} currency={currency} testId="report-print-table" />
            </>
          ) : (
            <p className={styles.empty}>No transactions in this period.</p>
          )}
        </section>
      ))}

      {report.loans.map((l) => (
        <section key={l.counterpartyAccountId} className={styles.section}>
          <h2 className={styles.sectionTitle}>Loan — {l.counterpartyName}</h2>
          <p className={styles.sectionSub}>
            Lent {money(l.totalLent)} · Repaid {money(l.totalRepaid)} · Outstanding {money(l.outstanding)}
          </p>
          {l.rows.length > 0 ? (
            <>
              <div className={styles.screenTable} data-testid="report-screen-table">
                <LedgerTable rows={toLedgerRows(l.rows, locale, currency)} desktop={isDesktop} />
              </div>
              <ReportPrintTable rows={l.rows} locale={locale} currency={currency} testId="report-print-table" />
            </>
          ) : (
            <p className={styles.empty}>No loan activity in this period.</p>
          )}
        </section>
      ))}

      {report.otherLedgers.map((l) => (
        <section key={l.ledgerId} className={styles.section}>
          <h2 className={styles.sectionTitle}>{l.ledgerName}</h2>
          <p className={styles.sectionSub}>
            Opening {money(l.opening)} · Closing {money(l.closing)}
          </p>
          {l.rows.length > 0 ? (
            <>
              <div className={styles.screenTable} data-testid="report-screen-table">
                <LedgerTable rows={toLedgerRows(l.rows, locale, currency)} desktop={isDesktop} />
              </div>
              <ReportPrintTable rows={l.rows} locale={locale} currency={currency} testId="report-print-table" />
            </>
          ) : (
            <p className={styles.empty}>No entries in this period.</p>
          )}
        </section>
      ))}
    </>
  );
}
