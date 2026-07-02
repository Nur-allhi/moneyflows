import { useEffect, useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LoanStack } from '../../domain/types';
import { useLoanStore } from '../stores/useLoanStore';
import { useAccountStore } from '../../../presentation/stores/useAccountStore';
import { useSettingsStore } from '../../../presentation/stores/useSettingsStore';
import { useTransactionStore } from '../../../presentation/stores/useTransactionStore';
import { useModalStore } from '../../../presentation/stores/useModalStore';
import { formatAmount } from '../../../presentation/utils/format';
import { shortDate } from '../../../presentation/constants/dates';
import { ProgressBar, LedgerTable } from '../../../presentation/components';
import type { LedgerRow } from '../../../presentation/components';
import styles from './LoanDetailView.module.css';

interface LoanDetailViewProps {
  stack: LoanStack;
}

export function LoanDetailView({ stack }: LoanDetailViewProps) {
  const navigate = useNavigate();
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const { transactions: txns, fetchTransactions } = useTransactionStore();
  const { deleteLoanStack } = useLoanStore();
  const { accounts } = useAccountStore();
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetchTransactions({ accountId: stack.debtorId });
  }, [stack]);

  const accountById = useMemo(() => Object.fromEntries(accounts.map((a) => [a.id, a])), [accounts]);

  const handleDelete = useCallback(async () => {
    await deleteLoanStack(stack.debtorId);
    navigate('/loans');
  }, [deleteLoanStack, stack.debtorId, navigate]);

  const ledgerRows: LedgerRow[] = useMemo(() => {
    const loanTypes = new Set(['lend', 'repay', 'loan_issue', 'loan_repayment', 'loan_received', 'loan_paidback']);
    const sorted = [...txns]
      .filter((tx) => loanTypes.has(tx.type))
      .sort((a, b) => {
        const c = a.date.localeCompare(b.date);
        if (c !== 0) return c;
        return (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
      });
    let running = 0;
    return sorted.map((tx) => {
      const isDebit = tx.type === 'lend' || tx.type === 'loan_issue' || tx.type === 'loan_paidback';
      const isCredit = tx.type === 'repay' || tx.type === 'loan_repayment' || tx.type === 'loan_received';
      if (isDebit) running += tx.amount;
      if (isCredit) running -= tx.amount;
      const src = tx.sourceAccount ? accountById[tx.sourceAccount]?.name : undefined;
      const dst = tx.destAccount ? accountById[tx.destAccount]?.name : undefined;
      return {
        id: tx.id,
        date: shortDate(tx.date, locale),
        description: src && dst ? `${src} \u2192 ${dst}` : tx.description,
        debit: isDebit ? formatAmount(tx.amount, locale, currency) : '\u2014',
        credit: isCredit ? formatAmount(tx.amount, locale, currency) : '\u2014',
        balance: formatAmount(running, locale, currency),
        type: isDebit ? 'expense' as const : 'income' as const,
        typeLabel: tx.type === 'lend' ? 'Lent' : tx.type === 'repay' ? 'Repayment' : tx.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      };
    }).reverse();
  }, [txns, locale, currency, accountById]);

  const handleRowClick = useCallback((row: LedgerRow) => {
    if (row.id) {
      const tx = txns.find((t) => t.id === row.id);
      useModalStore.getState().open('transaction-detail', { transaction: tx });
    }
  }, [txns]);

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
        <h3 className={styles.ledgerTitle}>Transaction Ledger</h3>
        <LedgerTable rows={ledgerRows} desktop showBalance onRowClick={handleRowClick} />
      </div>
    </div>
  );
}
