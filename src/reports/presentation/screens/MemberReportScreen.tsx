import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { GlassPanel, LedgerTable, Modal, BottomSheet } from '../../../presentation/components';
import type { LedgerRow } from '../../../presentation/components';
import { useMemberStore } from '../../../presentation/stores/useMemberStore';
import { useAccountStore } from '../../../presentation/stores/useAccountStore';
import { useSettingsStore } from '../../../presentation/stores/useSettingsStore';
import { getDatabase } from '../../../infrastructure/database/getDatabase';
import { formatAmount, formatAmountParts } from '../../../presentation/utils/format';
import { shortDate } from '../../../presentation/constants/dates';
import { MemberReportService } from '../../application/MemberReportService';
import type { MemberReport, MemberReportRow } from '../../domain/types';
import { ReportFilterSheet } from './ReportFilterSheet';
import type { ReportPreset } from './ReportFilterSheet';
import { downloadMemberReportPdf } from '../memberReportPdf';
import { downloadMemberReportCsv } from '../memberReportCsv';
import styles from './MemberReportScreen.module.css';

function presetRange(preset: ReportPreset, customStart: string, customEnd: string): { start?: string; end?: string; month?: string } {
  const today = new Date().toISOString().slice(0, 10);
  if (preset === 'month') return { month: today.slice(0, 7) };
  if (preset === 'last3') {
    const d = new Date();
    d.setMonth(d.getMonth() - 2, 1);
    return { start: d.toISOString().slice(0, 10), end: today };
  }
  if (preset === 'custom') {
    return {
      start: customStart || undefined,
      end: customEnd || undefined,
    };
  }
  return {};
}

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

export function MemberReportScreen() {
  const { id: memberId } = useParams<{ id: string }>();
  const members = useMemberStore((s) => s.members);
  const fetchMembers = useMemberStore((s) => s.fetchMembers);
  const accounts = useAccountStore((s) => s.accounts);
  const fetchAccounts = useAccountStore((s) => s.fetchAccounts);
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [preset, setPreset] = useState<ReportPreset>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [excluded, setExcluded] = useState<string[]>([]);
  const [includeLoans, setIncludeLoans] = useState(true);
  const [includeOtherLedgers, setIncludeOtherLedgers] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [report, setReport] = useState<MemberReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  useEffect(() => { fetchMembers(); }, [fetchMembers]);
  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const member = useMemo(() => members.find((m) => m.id === memberId) ?? null, [members, memberId]);
  const memberAccounts = useMemo(
    () => accounts.filter((a) => a.memberId === memberId && !a.deletedAt),
    [accounts, memberId],
  );

  const range = useMemo(
    () => presetRange(preset, customStart, customEnd),
    [preset, customStart, customEnd],
  );
  const excludedKey = useMemo(() => [...excluded].sort().join(','), [excluded]);

  useEffect(() => {
    if (!memberId) return;
    setLoading(true);
    setError('');
    const excludedSet = new Set(excludedKey ? excludedKey.split(',') : []);
    const picked = memberAccounts.filter((a) => !excludedSet.has(a.id)).map((a) => a.id);
    new MemberReportService(getDatabase())
      .generateReport({
        memberId,
        startDate: range.start,
        endDate: range.end,
        month: range.month,
        accountIds: excludedSet.size > 0 ? picked : undefined,
        includeLoans,
        includeOtherLedgers,
      })
      .then((r) => {
        setReport(r);
        setLoading(false);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to build report');
        setLoading(false);
      });
  }, [memberId, range, excludedKey, memberAccounts, includeLoans, includeOtherLedgers]);

  const toggleExcluded = useCallback((accountId: string) => {
    setExcluded((prev) => (prev.includes(accountId) ? prev.filter((x) => x !== accountId) : [...prev, accountId]));
  }, []);

  const handleResetFilters = useCallback(() => {
    setPreset('all');
    setCustomStart('');
    setCustomEnd('');
    setExcluded([]);
    setIncludeLoans(true);
    setIncludeOtherLedgers(true);
  }, []);

  const handlePdf = useCallback(() => {
    if (report) void downloadMemberReportPdf(report, { locale, currency });
  }, [report, locale, currency]);
  const handleCsv = useCallback(() => {
    if (report) downloadMemberReportCsv(report);
  }, [report]);
  const handlePrint = useCallback(() => { window.print(); }, []);

  const money = useCallback((n: number) => formatAmount(n, locale, currency), [locale, currency]);

  const hasActiveFilters = preset !== 'all' || excluded.length > 0 || !includeLoans || !includeOtherLedgers;
  const filterSummary = useMemo(() => {
    const label = preset === 'all'
      ? 'All time'
      : preset === 'month'
        ? 'This month'
        : preset === 'last3'
          ? 'Last 3 months'
          : `${customStart || '…'} – ${customEnd || '…'}`;
    const parts = [label];
    if (excluded.length > 0) parts.push(`${memberAccounts.length - excluded.length} of ${memberAccounts.length} accounts`);
    if (!includeLoans) parts.push('Loans off');
    if (!includeOtherLedgers) parts.push('Other ledgers off');
    return parts.join(' · ');
  }, [preset, customStart, customEnd, excluded, memberAccounts.length, includeLoans, includeOtherLedgers]);

  if (!member && !loading) {
    return (
      <div className={styles.container}>
        <GlassPanel className={styles.notFound}>
          <p>{error || 'Member not found'}</p>
        </GlassPanel>
      </div>
    );
  }

  const periodLabel = report && (report.summary.periodStart || report.summary.periodEnd)
    ? `${report.summary.periodStart || '…'} – ${report.summary.periodEnd || '…'}`
    : 'All time';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>{member?.name ?? 'Report'}</h1>
          <span className={styles.subtitle}>Whole member report · {periodLabel}</span>
          <span className={styles.summaryLine}>{filterSummary}</span>
        </div>
        <div className={`${styles.actions} ${styles.printHide}`}>
          <button
            className={`${styles.iconBtn} ${hasActiveFilters ? styles.iconActive : ''}`}
            onClick={() => setFiltersOpen(true)}
            aria-label="Report filters"
            title={`Filters · ${filterSummary}`}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54z" /></svg>
          </button>
          <button className={styles.actionBtn} onClick={handlePdf} disabled={!report}>PDF</button>
          <button className={styles.actionBtn} onClick={handleCsv} disabled={!report}>CSV</button>
          <button className={styles.actionBtn} onClick={handlePrint} disabled={!report}>Print</button>
        </div>
      </div>

      {loading && (
        <GlassPanel className={styles.hero}><p>Building report…</p></GlassPanel>
      )}

      {report && !loading && (
        <>
          <GlassPanel className={styles.hero}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Opening</span>
              <span className={styles.statValue}>{money(report.summary.opening)}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Money in</span>
              <span className={styles.statValue}>{money(report.summary.totalCredit)}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Money out</span>
              <span className={styles.statValue}>{money(report.summary.totalDebit)}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Closing</span>
              <span className={styles.statValue}>{money(report.summary.closing)}</span>
            </div>
          </GlassPanel>

          {report.accounts.map((a) => (
            <section key={a.accountId} className={styles.section}>
              <h2 className={styles.sectionTitle}>{a.accountName}</h2>
              <p className={styles.sectionSub}>
                Opening {money(a.opening)} · Closing {money(a.closing)}
              </p>
              {a.rows.length > 0 ? (
                <LedgerTable rows={toLedgerRows(a.rows, locale, currency)} desktop={isDesktop} />
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
                <LedgerTable rows={toLedgerRows(l.rows, locale, currency)} desktop={isDesktop} />
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
                <LedgerTable rows={toLedgerRows(l.rows, locale, currency)} desktop={isDesktop} />
              ) : (
                <p className={styles.empty}>No entries in this period.</p>
              )}
            </section>
          ))}
        </>
      )}

      {isDesktop ? (
        <Modal
          isOpen={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          title="Report filters"
          footer={<></>}
        >
          <ReportFilterSheet
            preset={preset} setPreset={setPreset}
            customStart={customStart} customEnd={customEnd}
            setCustomStart={setCustomStart} setCustomEnd={setCustomEnd}
            memberAccounts={memberAccounts} excluded={excluded} toggleExcluded={toggleExcluded}
            includeLoans={includeLoans} setIncludeLoans={setIncludeLoans}
            includeOtherLedgers={includeOtherLedgers} setIncludeOtherLedgers={setIncludeOtherLedgers}
            onReset={handleResetFilters} onApply={() => setFiltersOpen(false)}
          />
        </Modal>
      ) : (
        <BottomSheet isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} title="Report filters">
          <ReportFilterSheet
            preset={preset} setPreset={setPreset}
            customStart={customStart} customEnd={customEnd}
            setCustomStart={setCustomStart} setCustomEnd={setCustomEnd}
            memberAccounts={memberAccounts} excluded={excluded} toggleExcluded={toggleExcluded}
            includeLoans={includeLoans} setIncludeLoans={setIncludeLoans}
            includeOtherLedgers={includeOtherLedgers} setIncludeOtherLedgers={setIncludeOtherLedgers}
            onReset={handleResetFilters} onApply={() => setFiltersOpen(false)}
          />
        </BottomSheet>
      )}
    </div>
  );
}
