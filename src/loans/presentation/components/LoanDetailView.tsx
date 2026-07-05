import { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { LoanStack } from '../../domain/types';
import { useLoanStore } from '../stores/useLoanStore';
import { useAccountStore } from '../../../presentation/stores/useAccountStore';
import { useMemberStore } from '../../../presentation/stores/useMemberStore';
import { useSettingsStore } from '../../../presentation/stores/useSettingsStore';
import { useTransactionStore } from '../../../presentation/stores/useTransactionStore';
import { useModalStore } from '../../../presentation/stores/useModalStore';
import { formatAmount } from '../../../presentation/utils/format';
import { shortDate, MONTHS } from '../../../presentation/constants/dates';
import { ProgressBar, LedgerTable } from '../../../presentation/components';
import type { LedgerRow } from '../../../presentation/components';
import styles from './LoanDetailView.module.css';

interface LoanDetailViewProps {
  stack: LoanStack;
}

type TxFilter = 'all' | 'lend' | 'repay';

export function LoanDetailView({ stack }: LoanDetailViewProps) {
  const navigate = useNavigate();
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const { transactions: txns, fetchTransactions } = useTransactionStore();
  const { deleteLoanStack } = useLoanStore();
  const { accounts } = useAccountStore();
  const { members } = useMemberStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [txFilter, setTxFilter] = useState<TxFilter>('all');
  const [month, setMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateMode, setDateMode] = useState<'none' | 'month' | 'range'>('none');
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTransactions({ accountId: stack.debtorId });
  }, [stack]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    if (showFilters) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFilters]);

  const accountById = useMemo(() => Object.fromEntries(accounts.map((a) => [a.id, a])), [accounts]);
  const memberById = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members]);

  const handleDelete = useCallback(async () => {
    await deleteLoanStack(stack.debtorId);
    navigate('/loans');
  }, [deleteLoanStack, stack.debtorId, navigate]);

  const handleAddRepayment = useCallback(() => {
    useModalStore.getState().open('transaction-form', {
      initialTab: 'loan',
      initialBorrowerId: stack.debtorId,
    });
  }, [stack.debtorId]);

  const sortedTxs = useMemo(() => {
    const loanTypes = new Set(['lend', 'repay', 'loan_issue', 'loan_repayment', 'loan_received', 'loan_paidback']);
    return [...txns]
      .filter((tx) => loanTypes.has(tx.type))
      .sort((a, b) => {
        const c = a.date.localeCompare(b.date);
        if (c !== 0) return c;
        return (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
      });
  }, [txns]);

  const filteredTxs = useMemo(() => {
    let result = sortedTxs;

    if (txFilter === 'lend') {
      result = result.filter((tx) => tx.type === 'lend' || tx.type === 'loan_issue');
    } else if (txFilter === 'repay') {
      result = result.filter((tx) => tx.type === 'repay' || tx.type === 'loan_repayment' || tx.type === 'loan_paidback');
    }

    if (dateMode === 'month' && month) {
      result = result.filter((tx) => tx.date.startsWith(month));
    } else if (dateMode === 'range') {
      if (startDate) result = result.filter((tx) => tx.date >= startDate);
      if (endDate) result = result.filter((tx) => tx.date <= endDate);
    }

    return result;
  }, [sortedTxs, txFilter, month, startDate, endDate, dateMode]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (txFilter !== 'all') count++;
    if (dateMode !== 'none') count++;
    return count;
  }, [txFilter, dateMode]);

  const ledgerRows: LedgerRow[] = useMemo(() => {
    let running = 0;
    return filteredTxs.map((tx) => {
      const isDebit = tx.type === 'lend' || tx.type === 'loan_issue' || tx.type === 'loan_paidback';
      const isCredit = tx.type === 'repay' || tx.type === 'loan_repayment' || tx.type === 'loan_received';
      if (isDebit) running += tx.amount;
      if (isCredit) running -= tx.amount;
      const srcAcct = tx.sourceAccount ? accountById[tx.sourceAccount] : undefined;
      const dstAcct = tx.destAccount ? accountById[tx.destAccount] : undefined;
      const srcMember = srcAcct?.memberId ? memberById[srcAcct.memberId] : undefined;
      const dstMember = dstAcct?.memberId ? memberById[dstAcct.memberId] : undefined;
      const bracket = isDebit
        ? (srcMember && srcAcct ? `${srcMember.name} - ${srcAcct.name}` : undefined)
        : (dstMember && dstAcct ? `${dstMember.name} - ${dstAcct.name}` : undefined);
      return {
        id: tx.id,
        date: shortDate(tx.date, locale),
        description: bracket ? `${tx.description} [${bracket}]` : tx.description,
        debit: isDebit ? formatAmount(tx.amount, locale, currency) : '\u2014',
        credit: isCredit ? formatAmount(tx.amount, locale, currency) : '\u2014',
        balance: formatAmount(running, locale, currency),
        type: isDebit ? 'expense' as const : 'income' as const,
        typeLabel: tx.type === 'lend' || tx.type === 'loan_issue' ? 'Lent' :
                   tx.type === 'repay' || tx.type === 'loan_repayment' ? 'Repayment' : 'Paid Back',
      };
    }).reverse();
  }, [filteredTxs, locale, currency, accountById, memberById]);

  const handleRowClick = useCallback((row: LedgerRow) => {
    if (row.id) {
      const tx = txns.find((t) => t.id === row.id);
      useModalStore.getState().open('transaction-detail', { transaction: tx });
    }
  }, [txns]);

  const clearFilters = useCallback(() => {
    setTxFilter('all');
    setDateMode('none');
    setMonth('');
    setStartDate('');
    setEndDate('');
    setShowFilters(false);
  }, []);

  const downloadPdf = useCallback(() => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const isLend = (t: typeof filteredTxs[0]) => t.type === 'lend' || t.type === 'loan_issue' || t.type === 'loan_paidback';
    let running = 0;
    const pdfRows = filteredTxs.map((tx) => {
      const d = isLend(tx);
      if (d) running += tx.amount;
      else running -= tx.amount;
      const srcAcct = tx.sourceAccount ? accountById[tx.sourceAccount] : undefined;
      const dstAcct = tx.destAccount ? accountById[tx.destAccount] : undefined;
      const srcMember = srcAcct?.memberId ? memberById[srcAcct.memberId] : undefined;
      const dstMember = dstAcct?.memberId ? memberById[dstAcct.memberId] : undefined;
      const bracket = d
        ? (srcMember && srcAcct ? `${srcMember.name} / ${srcAcct.name}` : undefined)
        : (dstMember && dstAcct ? `${dstMember.name} / ${dstAcct.name}` : undefined);
      return [
        shortDate(tx.date, locale),
        d ? 'Lent' : 'Repayment',
        bracket ? `${tx.description} (${bracket})` : tx.description,
        d ? formatAmount(tx.amount, locale, currency) : '',
        d ? '' : formatAmount(tx.amount, locale, currency),
        formatAmount(running, locale, currency),
      ];
    });

    if (pdfRows.length === 0) return;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Loan Ledger Report', pageW / 2, 20, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`${stack.debtorName}`, pageW / 2, 30, { align: 'center' });

    const periodLabel = dateMode === 'month' && month
      ? `${MONTHS[parseInt(month.split('-')[1]!, 10) - 1]} ${month.split('-')[0]}`
      : dateMode === 'range' && (startDate || endDate)
        ? `${startDate || '...'} to ${endDate || '...'}`
        : 'All time';
    doc.text(`Period: ${periodLabel}`, pageW / 2, 38, { align: 'center' });

    autoTable(doc, {
      head: [['Date', 'Type', 'Description', 'Lent', 'Repaid', 'Balance']],
      body: pdfRows,
      startY: 46,
      styles: { fontSize: 8, cellPadding: 2, halign: 'center', overflow: 'linebreak' },
      headStyles: { fillColor: [55, 65, 81], fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 20 },
        2: { cellWidth: 'auto', halign: 'left' },
        3: { cellWidth: 28 },
        4: { cellWidth: 28 },
        5: { cellWidth: 28 },
      },
      margin: { left: 10, right: 10 },
      tableWidth: 'auto',
    });

    const label = stack.debtorName.replace(/\s+/g, '_').toLowerCase();
    doc.save(`loan_ledger_${label}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }, [filteredTxs, locale, currency, stack.debtorName, dateMode, month, startDate, endDate]);

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate('/loans')}>
        {'\u2190'} All Loans
      </button>

      <div className={styles.summary}>
        <div className={styles.summaryTop}>
          <div className={styles.summaryInfo}>
            <span className={styles.typeLabel}>{stack.stackType === 'internal' ? 'Internal' : 'External'}</span>
            <div className={styles.debtorName}>
              {stack.debtorName}
              <span className={styles.badge}>{stack.stackType === 'internal' ? 'Internal' : 'Debtor'}</span>
            </div>
          </div>
          <div className={styles.summaryAmount}>
            <div className={styles.amountValue}>{formatAmount(stack.totalOutstanding, locale, currency)}</div>
            <div className={styles.amountLabel}>Total Outstanding</div>
          </div>
        </div>
        <ProgressBar
          percent={stack.progressPercent}
          label="Repayment Progress"
          sublabel={stack.activeCount > 0
            ? `${stack.progressPercent}% repaid - ${formatAmount(stack.totalOutstanding, locale, currency)} remaining`
            : `${formatAmount(stack.totalOutstanding, locale, currency)} remaining`}
        />
        <div className={styles.actions}>
          {stack.isSettled ? (
            <span className={styles.settledBadge}>Settled</span>
          ) : (
            <>
              <button className={styles.repayBtn} onClick={handleAddRepayment}>+ Repayment</button>
              <button className={styles.deleteBtn} onClick={() => setConfirmDelete(true)}>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className={styles.overlay} onClick={() => setConfirmDelete(false)}>
          <div className={styles.confirmForm} onClick={(e) => e.stopPropagation()}>
            <p>Delete all loans for <strong>{stack.debtorName}</strong>?</p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.ledgerSection}>
        <div className={styles.ledgerHead}>
          <h3 className={styles.ledgerTitle}>Transaction Ledger</h3>
          <div className={styles.ledgerActions}>
            <button className={styles.pdfBtn} onClick={downloadPdf} title="Download PDF">
              {'\u{1F4E5}'} <span className={styles.pdfBtnLabel}>Download PDF</span>
            </button>
            <div className={styles.filterWrap} ref={filterRef}>
              <button
                className={`${styles.filterBtn} ${activeFilterCount > 0 ? styles.filterActive : ''}`}
                onClick={() => setShowFilters((s) => !s)}
              >
                {'\u{1F50D}'} Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>
              {showFilters && (
                <div className={styles.filterDropdown}>
                  <div className={styles.filterGroup}>
                    <span className={styles.filterGroupLabel}>Type</span>
                    <div className={styles.filterPills}>
                      {(['all', 'lend', 'repay'] as const).map((f) => (
                        <button
                          key={f}
                          className={`${styles.pill} ${txFilter === f ? styles.pillActive : ''}`}
                          onClick={() => setTxFilter(f)}
                        >{f === 'all' ? 'All' : f === 'lend' ? 'Loans Issued' : 'Repayments'}</button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.filterGroup}>
                    <span className={styles.filterGroupLabel}>Date</span>
                    <div className={styles.filterPills}>
                      {(['none', 'month', 'range'] as const).map((d) => (
                        <button
                          key={d}
                          className={`${styles.pill} ${dateMode === d ? styles.pillActive : ''}`}
                          onClick={() => setDateMode(d)}
                        >{d === 'none' ? 'All' : d === 'month' ? 'Month' : 'Range'}</button>
                      ))}
                    </div>
                    {dateMode === 'month' && (
                      <input type="month" className={styles.filterInput} value={month} onChange={(e) => setMonth(e.target.value)} />
                    )}
                    {dateMode === 'range' && (
                      <div className={styles.dateRangeRow}>
                        <input type="date" className={styles.filterInput} value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="Start" />
                        <span className={styles.dateSep}>to</span>
                        <input type="date" className={styles.filterInput} value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="End" />
                      </div>
                    )}
                  </div>
                  <button className={styles.clearBtn} onClick={clearFilters}>Clear Filters</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <LedgerTable rows={ledgerRows} desktop showBalance onRowClick={handleRowClick} />
      </div>
    </div>
  );
}
