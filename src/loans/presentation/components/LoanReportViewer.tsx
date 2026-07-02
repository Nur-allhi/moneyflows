import { useState, useCallback, useMemo, useRef } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAccountStore } from '../../../presentation/stores/useAccountStore';
import { useSettingsStore } from '../../../presentation/stores/useSettingsStore';
import { useLoanReportStore } from '../stores/useLoanReportStore';
import { formatAmount } from '../../../presentation/utils/format';
import { shortDate } from '../../../presentation/constants/dates';
import { displayType } from '../../../presentation/constants/labels';
import type { LoanReportFilter, LoanReport } from '../../domain/types';
import styles from './LoanReportViewer.module.css';

interface LoanReportViewerProps {
  initialBorrowerAccountId?: string;
  onClose: () => void;
}

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'lend', label: 'Loans Issued' },
  { key: 'repay', label: 'Repayments' },
] as const;

function downloadPdf(report: LoanReport, locale: string, currency: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Loan Account Report', pageW / 2, 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${shortDate(report.generatedAt, locale)}`, pageW / 2, 28, { align: 'center' });

  const summaryY = 36;
  doc.setFontSize(8);
  doc.setTextColor(120);
  const labels = ['Total Lent', 'Total Repaid', 'Outstanding', 'Transactions'];
  const values = [
    formatAmount(report.summary.totalLent, locale, currency),
    formatAmount(report.summary.totalRepaid, locale, currency),
    formatAmount(report.summary.outstanding, locale, currency),
    String(report.summary.transactionCount),
  ];
  const colW = (pageW - 20) / 4;
  for (let i = 0; i < 4; i++) {
    const cx = 10 + colW * i + colW / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const color = i === 0 ? [214, 70, 40] as const : i === 1 ? [40, 167, 110] as const : i === 2 ? (report.summary.outstanding > 0 ? [214, 70, 40] as const : [40, 167, 110] as const) : [200, 200, 200] as const;
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(values[i]!, cx, summaryY, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(labels[i]!, cx, summaryY + 5, { align: 'center' });
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80);
  const infoY = summaryY + 14;
  doc.text(`Borrower: ${report.summary.borrowerName}`, 10, infoY);
  doc.text(`Lender: ${report.summary.lenderName}`, 10, infoY + 5);
  if (report.filter.type && report.filter.type !== 'all') {
    doc.text(`Type filter: ${report.filter.type === 'lend' ? 'Loans Issued' : 'Repayments'}`, 10, infoY + 10);
  }
  if (report.filter.month) {
    const [y, m] = report.filter.month.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    doc.text(`Period: ${months[parseInt(m!, 10) - 1]} ${y}`, 10, infoY + 15);
  } else if (report.filter.startDate || report.filter.endDate) {
    doc.text(`Period: ${report.filter.startDate || '...'} to ${report.filter.endDate || '...'}`, 10, infoY + 15);
  } else {
    doc.text('Period: All time', 10, infoY + 15);
  }

  const tableStartY = infoY + 22;
  const rows = report.rows.map((r) => [
    r.date.slice(0, 10),
    r.typeLabel,
    r.description,
    r.lenderAccount,
    r.borrowerAccount,
    formatAmount(r.amount, locale, currency),
    formatAmount(r.runningBalance, locale, currency),
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [['Date', 'Type', 'Description', 'From', 'To', 'Amount', 'Balance']],
    body: rows,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [98, 56, 224], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 18 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 28 },
      4: { cellWidth: 28 },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 24, halign: 'right' },
    },
    foot: [[
      '', '', '', '', 'Total',
      formatAmount(report.summary.totalLent + report.summary.totalRepaid, locale, currency),
      formatAmount(report.summary.outstanding, locale, currency),
    ]],
    footStyles: { fillColor: [240, 240, 245], fontStyle: 'bold', fontSize: 7 },
  });

  const filterLabel = report.filter.borrowerAccountId
    ? `loan_report_${report.summary.borrowerName.replace(/\s+/g, '_').toLowerCase()}`
    : 'loan_report_all_accounts';
  const dateLabel = report.filter.month
    ? report.filter.month
    : new Date().toISOString().slice(0, 7);
  doc.save(`${filterLabel}_${dateLabel}.pdf`);
}

export function LoanReportViewer({ initialBorrowerAccountId, onClose }: LoanReportViewerProps) {
  const { accounts } = useAccountStore();
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const { report, loading, error, generateReport, clearReport } = useLoanReportStore();
  const downloadingRef = useRef(false);

  const [selectedBorrower, setSelectedBorrower] = useState(initialBorrowerAccountId ?? '');
  const [filterType, setFilterType] = useState<'all' | 'lend' | 'repay'>('all');
  const [dateMode, setDateMode] = useState<'all' | 'month' | 'range'>('all');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const borrowerAccounts = useMemo(() =>
    accounts.filter((a) => !a.memberId || a.type === 'counterparty'),
  [accounts]);

  const handleGenerate = useCallback(async () => {
    const filter: LoanReportFilter = { type: filterType };
    if (selectedBorrower) filter.borrowerAccountId = selectedBorrower;
    if (dateMode === 'month') filter.month = month;
    if (dateMode === 'range') {
      filter.startDate = startDate || undefined;
      filter.endDate = endDate || undefined;
    }
    await generateReport(filter);
  }, [selectedBorrower, filterType, dateMode, month, startDate, endDate, generateReport]);

  const handleDownload = useCallback(() => {
    if (!report || downloadingRef.current) return;
    downloadingRef.current = true;
    try {
      downloadPdf(report, locale, currency);
    } finally {
      downloadingRef.current = false;
    }
  }, [report, locale, currency]);

  const handleClose = useCallback(() => {
    clearReport();
    onClose();
  }, [clearReport, onClose]);

  if (report) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Loan Report</h2>
          <button className={styles.closeBtn} onClick={handleClose}>&times;</button>
        </div>

        <div className={styles.summaryBar}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Lent</span>
            <span className={styles.summaryValue} style={{ color: 'var(--color-expense)' }}>{formatAmount(report.summary.totalLent, locale, currency)}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Repaid</span>
            <span className={styles.summaryValue} style={{ color: 'var(--color-income)' }}>{formatAmount(report.summary.totalRepaid, locale, currency)}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Outstanding</span>
            <span className={styles.summaryValue} style={{ color: report.summary.outstanding > 0 ? 'var(--color-expense)' : 'var(--color-income)' }}>{formatAmount(report.summary.outstanding, locale, currency)}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Transactions</span>
            <span className={styles.summaryValue}>{report.summary.transactionCount}</span>
          </div>
        </div>

        {report.summary.borrowerName !== 'All Accounts' && (
          <div className={styles.contextRow}>
            <span className={styles.contextLabel}>Borrower:</span>
            <span>{report.summary.borrowerName}</span>
            <span className={styles.contextSeparator}>|</span>
            <span className={styles.contextLabel}>Lender:</span>
            <span>{report.summary.lenderName}</span>
          </div>
        )}

        <div className={styles.tableWrap}>
          {report.rows.length === 0 ? (
            <div className={styles.empty}>No transactions match the filter</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>From</th>
                  <th>To</th>
                  <th className={styles.numCol}>Amount</th>
                  <th className={styles.numCol}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <tr key={row.id} className={row.type === 'lend' ? styles.debitRow : styles.creditRow}>
                    <td className={styles.dateCell}>{shortDate(row.date, locale)}</td>
                    <td><span className={`${styles.typeBadge} ${row.type === 'lend' ? styles.lendBadge : styles.repayBadge}`}>{row.typeLabel}</span></td>
                    <td className={styles.descCell}>{row.description}</td>
                    <td className={styles.acctCell}>{row.lenderAccount}</td>
                    <td className={styles.acctCell}>{row.borrowerAccount}</td>
                    <td className={styles.numCol}>{formatAmount(row.amount, locale, currency)}</td>
                    <td className={styles.numCol}>{formatAmount(row.runningBalance, locale, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.footer}>
          <span className={styles.generatedAt}>Generated: {shortDate(report.generatedAt, locale)}</span>
          <div className={styles.footerActions}>
            <button className={styles.newReportBtn} onClick={clearReport}>New Report</button>
            <button className={styles.downloadBtn} onClick={handleDownload} disabled={downloadingRef.current || report.rows.length === 0}>
              {downloadingRef.current ? 'Downloading...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Loan Report</h2>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
      </div>

      <p className={styles.intro}>
        Select filters below and generate a PDF report of loan transactions.
      </p>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Account</span>
        <select
          className={styles.select}
          value={selectedBorrower}
          onChange={(e) => setSelectedBorrower(e.target.value)}
        >
          <option value="">All accounts</option>
          {borrowerAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} - {displayType(a.type)}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Transaction Type</span>
        <div className={styles.tabStrip}>
          {FILTER_TABS.map((t) => (
            <button
              key={t.key}
              className={`${styles.tabBtn} ${filterType === t.key ? styles.tabActive : ''}`}
              onClick={() => setFilterType(t.key)}
            >{t.label}</button>
          ))}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Date Range</span>
        <div className={styles.tabStrip}>
          <button className={`${styles.tabBtn} ${dateMode === 'all' ? styles.tabActive : ''}`} onClick={() => setDateMode('all')}>All Time</button>
          <button className={`${styles.tabBtn} ${dateMode === 'month' ? styles.tabActive : ''}`} onClick={() => setDateMode('month')}>Month</button>
          <button className={`${styles.tabBtn} ${dateMode === 'range' ? styles.tabActive : ''}`} onClick={() => setDateMode('range')}>Date Range</button>
        </div>
        {dateMode === 'month' && (
          <input
            type="month"
            className={styles.input}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        )}
        {dateMode === 'range' && (
          <div className={styles.dateRangeRow}>
            <input
              type="date"
              className={styles.input}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start"
            />
            <span className={styles.dateSep}>to</span>
            <input
              type="date"
              className={styles.input}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End"
            />
          </div>
        )}
      </div>

      {error && <span className={styles.error}>{error}</span>}

      <button className={styles.generateBtn} onClick={handleGenerate} disabled={loading}>
        {loading ? 'Loading...' : 'Generate Report'}
      </button>
    </div>
  );
}
