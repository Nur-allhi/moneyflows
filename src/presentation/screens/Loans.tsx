import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProgressBar, GlassPanel, LedgerTable } from '../components';
import type { LedgerRow } from '../components';
import { useLoanStore } from '../stores/useLoanStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import type { Transaction } from '../../core/domain/Transaction';
import type { LoanStack as LoanStackType } from '../../core/domain/Loan';
import type { Account } from '../../core/domain/Account';
import { formatAmount } from '../utils/format';
import { shortDate } from '../constants/dates';
import { ACCOUNT_TYPE_GRADIENT_THREE, ACCOUNT_TYPE_GRADIENT } from '../constants/labels';
import { useModalStore } from '../stores/useModalStore';
import styles from './Loans.module.css';

function LoanDetailView({ stack, accounts }: { stack: LoanStackType; accounts: Account[] }) {
  const navigate = useNavigate();
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const { transactions: txns, fetchTransactions } = useTransactionStore();
  const { deleteLoanStack } = useLoanStore();
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetchTransactions({ accountId: stack.debtorId });
  }, [stack.debtorId]);

  const accountById = useMemo(() => Object.fromEntries(accounts.map((a) => [a.id, a])), [accounts]);
  const cpAcct = accountById[stack.debtorId];
  const isInternal = stack.stackType === 'internal';
  const cpType = isInternal ? 'internal' : ((cpAcct?.metadata?.counterpartyType as string) ?? 'debtor');
  const typeLabel = isInternal ? 'Internal' : (cpType === 'creditor' ? 'Creditor' : 'Debtor');

  const lenderAccountId = useMemo(() => {
    if (!isInternal) return null;
    const issueTx = txns.find((t) => t.type === 'loan_issue' && t.destAccount === stack.debtorId);
    return issueTx?.sourceAccount ?? null;
  }, [txns, stack.debtorId, isInternal]);

  const handleOpenRepay = useCallback(() => {
    if (isInternal) {
      useModalStore.getState().open('transaction-form', {
        initialTab: 'loan',
        initialSource: stack.debtorId,
        initialDestination: lenderAccountId ?? '',
        initialLoanTargetType: 'internal',
        internalAction: 'repay',
      });
    } else if (cpType === 'creditor') {
      useModalStore.getState().open('transaction-form', {
        initialTab: 'loan',
        initialLoanMode: 'payback',
        initialCounterpartyId: stack.debtorId,
      });
    } else {
      useModalStore.getState().open('transaction-form', {
        initialTab: 'loan',
        initialLoanMode: 'repay',
        initialCounterpartyId: stack.debtorId,
      });
    }
  }, [stack, lenderAccountId, isInternal, cpType]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteLoanStack(stack.debtorId);
      navigate('/loans');
    } catch {
      setConfirmDelete(false);
    }
  }, [deleteLoanStack, stack.debtorId, navigate]);

  const txLabel = (type: string, cpType: string) => {
    const labels: Record<string, Record<string, string>> = {
      debtor: { loan_issue: 'Loan Issued', loan_repayment: 'Repayment Received' },
      creditor: { loan_received: 'Loan Received', loan_paidback: 'Repayment Sent' },
      internal: { loan_issue: 'Loan Issued', loan_repayment: 'Repayment Received' },
    };
    return labels[cpType]?.[type] ?? type;
  };

  const txDesc = (tx: Transaction) => {
    const src = tx.sourceAccount ? accountById[tx.sourceAccount]?.name : undefined;
    const dst = tx.destAccount ? accountById[tx.destAccount]?.name : undefined;
    if (!src && !dst) return tx.description;
    return `${src ?? ''} \u2192 ${dst ?? ''}`;
  };

  const ledgerRows: LedgerRow[] = useMemo(() => {
    const loanTypes = new Set(['loan_issue', 'loan_repayment', 'loan_received', 'loan_paidback']);
    const sorted = [...txns]
      .filter((tx) => loanTypes.has(tx.type))
      .sort((a, b) => {
        const c = a.date.localeCompare(b.date);
        if (c !== 0) return c;
        return (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
      });
    let running = 0;
    return sorted.map((tx) => {
      const isDebit = tx.type === 'loan_issue' || tx.type === 'loan_paidback';
      const isCredit = tx.type === 'loan_repayment' || tx.type === 'loan_received';
      if (isDebit) running += tx.amount;
      if (isCredit) running -= tx.amount;
      return {
        id: tx.id,
        date: shortDate(tx.date, locale),
        description: txDesc(tx),
        debit: isDebit ? formatAmount(tx.amount, locale, currency) : '\u2014',
        credit: isCredit ? formatAmount(tx.amount, locale, currency) : '\u2014',
        balance: formatAmount(running, locale, currency),
        type: isDebit ? 'expense' as const : 'income' as const,
        typeLabel: txLabel(tx.type, cpType),
      };
    }).reverse();
  }, [txns, locale, currency]);

  const handleRowClick = useCallback((row: LedgerRow) => {
    if (row.id) useModalStore.getState().open('transaction-detail', { txId: row.id });
  }, []);

  const debtorSummary = (() => {
    const total = stack.totalOutstanding;
    const recovered = stack.totalRecovered;
    const issued = total + recovered;
    const pct = issued > 0 ? Math.round((recovered / issued) * 100) : 0;
    return {
      name: stack.debtorName,
      badge: typeLabel,
      registered: `${stack.loans.length} active loan${stack.loans.length !== 1 ? 's' : ''}`,
      totalOutstanding: formatAmount(total, locale, currency),
      repaidPercent: pct,
      repaidDetail: `${pct}% repaid \u2022 ${formatAmount(total, locale, currency)} remaining`,
    };
  })();

  return (
    <div className={styles.loans}>
      <button className={styles.backBtn} onClick={() => navigate('/loans')}>
        {'\u2190'} All Loans
      </button>

      <div className={styles.summary}>
        <div className={styles.summaryTop}>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLabel}>{typeLabel}</span>
            <div className={styles.summaryDebtor}>
              {debtorSummary.name}
              <span className={styles.badge}>{debtorSummary.badge}</span>
            </div>
            <span className={styles.summaryRegistered}>{debtorSummary.registered}</span>
          </div>
          <div className={styles.summaryAmount}>
            <div className={styles.summaryValue}>{debtorSummary.totalOutstanding}</div>
            <div className={styles.summaryAmountLabel}>Total Outstanding</div>
            {stack.totalOutstanding > 0 && (
              <button className={styles.repayBtn} onClick={handleOpenRepay}>
                {cpType === 'creditor' ? 'Pay Back' : 'Repay'}
              </button>
            )}
          </div>
        </div>
        <ProgressBar
          percent={debtorSummary.repaidPercent}
          label="Repayment Progress"
          sublabel={debtorSummary.repaidDetail}
        />
        <button className={styles.deleteBtn} onClick={() => setConfirmDelete(true)}>
          Delete Loan Account
        </button>
      </div>

      {confirmDelete && (
        <div className={styles.overlay} onClick={() => setConfirmDelete(false)}>
          <div className={styles.confirmForm} onClick={(e) => e.stopPropagation()}>
            <div className={styles.formHeader}>
              <h3>Delete Loan Account</h3>
              <button className={styles.formClose} onClick={() => setConfirmDelete(false)}>&times;</button>
            </div>
            <div className={styles.formBody}>
              <p className={styles.confirmText}>
                This will permanently remove all loans and transactions associated with <strong>{stack.debtorName}</strong>. This action cannot be undone.
              </p>
              <div className={styles.confirmActions}>
                <button className={styles.cancelBtn} onClick={() => setConfirmDelete(false)}>Cancel</button>
                <button className={styles.confirmDeleteBtn} onClick={handleDelete}>Delete</button>
              </div>
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

function AddCounterpartyForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'debtor' | 'creditor'>('debtor');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const { createCounterparty } = useLoanStore();
  const { fetchAccounts } = useAccountStore();

  const handleSave = async () => {
    if (!name.trim()) { setErr('Name is required'); return; }
    setSaving(true);
    setErr('');
    try {
      await createCounterparty(name.trim(), type);
      await fetchAccounts();
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.counterpartyForm} onClick={(e) => e.stopPropagation()}>
        <div className={styles.formHeader}>
          <h3>Add Counterparty</h3>
          <button className={styles.formClose} onClick={onClose}>&times;</button>
        </div>
        <div className={styles.formBody}>
          <div className={styles.formToggle}>
            <button
              className={`${styles.toggleBtn} ${type === 'debtor' ? styles.toggleActive : ''}`}
              onClick={() => setType('debtor')}
            >Debtor</button>
            <button
              className={`${styles.toggleBtn} ${type === 'creditor' ? styles.toggleActive : ''}`}
              onClick={() => setType('creditor')}
            >Creditor</button>
          </div>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Name</span>
            <input className={styles.formInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </div>
          {err && <span className={styles.formError}>{err}</span>}
          <button className={styles.formSubmit} onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? 'Creating...' : `Create ${type === 'debtor' ? 'Debtor' : 'Creditor'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Loans() {
  const { debtorId: routeDebtorId } = useParams<{ debtorId: string }>();
  const navigate = useNavigate();
  const { loanStacks, loading, error, fetchLoanStacks } = useLoanStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const [showAddCp, setShowAddCp] = useState(false);
  const [filter, setFilter] = useState<'all' | 'debtor' | 'creditor' | 'internal'>('all');

  useEffect(() => {
    fetchLoanStacks();
    fetchAccounts();
  }, []);

  const selectedStack = useMemo(() => {
    if (!routeDebtorId || loanStacks.length === 0) return null;
    return loanStacks.find((s) => s.debtorId === routeDebtorId) ?? null;
  }, [loanStacks, routeDebtorId]);

  const accountById = useMemo(() => Object.fromEntries(accounts.map((a) => [a.id, a])), [accounts]);

  const stacksWithType = useMemo(() => loanStacks.map((s) => ({
    ...s,
    cpType: s.stackType === 'internal' ? 'internal' : ((accountById[s.debtorId]?.metadata?.counterpartyType as string) ?? 'debtor'),
  })), [loanStacks, accountById]);

  const filteredStacks = useMemo(() => {
    if (filter === 'all') return stacksWithType;
    return stacksWithType.filter((s) => s.cpType === filter);
  }, [stacksWithType, filter]);

  const debtorTotal = useMemo(
    () => stacksWithType.filter((s) => s.cpType === 'debtor').reduce((s, x) => s + x.totalOutstanding, 0),
    [stacksWithType],
  );

  const creditorTotal = useMemo(
    () => stacksWithType.filter((s) => s.cpType === 'creditor').reduce((s, x) => s + x.totalOutstanding, 0),
    [stacksWithType],
  );

  const internalTotal = useMemo(
    () => stacksWithType.filter((s) => s.cpType === 'internal').reduce((s, x) => s + x.totalOutstanding, 0),
    [stacksWithType],
  );

  if (loading) {
    return (
      <div className={styles.loans}>
        <div className="skeleton skeleton-summary" />
        <div className={styles.loadingStacks}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton-stack" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.loans}>
        <GlassPanel padding="lg">
          <div className="error-state">
            <div className="error-state-icon">{'\u26A0\uFE0F'}</div>
            <p className="error-state-text">Could not load loan data</p>
            <button className="retry-btn" onClick={fetchLoanStacks}>Retry</button>
          </div>
        </GlassPanel>
      </div>
    );
  }

  if (routeDebtorId && selectedStack) {
    return <LoanDetailView stack={selectedStack} accounts={accounts} />;
  }

  if (routeDebtorId && !selectedStack) {
    return (
      <div className={styles.loans}>
        <GlassPanel padding="lg">
          <div className="empty-state">
            <div className="empty-state-icon">{'\u{1F50D}'}</div>
            <p className="empty-state-text">Counterparty not found</p>
            <button className="retry-btn" onClick={() => navigate('/loans')}>View all</button>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className={styles.loans}>
      <div className={styles.listHeader}>
        <h2 className={styles.listTitle}>Your Loans</h2>
        <div className={styles.listActions}>
          <span className={styles.listCount}>{loanStacks.length} Account{loanStacks.length !== 1 ? 's' : ''}</span>
          <button className={styles.addCpBtn} onClick={() => setShowAddCp(true)}>+ Add</button>
        </div>
      </div>

      <div className={styles.filterStrip}>
        <button className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`} onClick={() => setFilter('all')}>
          All <span className={styles.filterAmt}>{formatAmount(debtorTotal + creditorTotal + internalTotal, locale, currency)}</span>
        </button>
        <button className={`${styles.filterBtn} ${filter === 'debtor' ? styles.filterActive : ''}`} onClick={() => setFilter('debtor')}>
          Debtors <span className={styles.filterAmt}>{formatAmount(debtorTotal, locale, currency)}</span>
        </button>
        <button className={`${styles.filterBtn} ${filter === 'creditor' ? styles.filterActive : ''}`} onClick={() => setFilter('creditor')}>
          Creditors <span className={styles.filterAmt}>{formatAmount(creditorTotal, locale, currency)}</span>
        </button>
        <button className={`${styles.filterBtn} ${filter === 'internal' ? styles.filterActive : ''}`} onClick={() => setFilter('internal')}>
          Internal <span className={styles.filterAmt}>{formatAmount(internalTotal, locale, currency)}</span>
        </button>
      </div>

      {filteredStacks.length === 0 ? (
        <GlassPanel padding="lg">
          <div className="empty-state">
            <div className="empty-state-icon">{'\u{1F4B5}'}</div>
            <p className="empty-state-text">No {filter === 'all' ? 'active loans' : `${filter}s`}</p>
          </div>
        </GlassPanel>
      ) : (
        <div className={styles.debtorGrid}>
          {filteredStacks.map((stack) => {
            const total = stack.totalOutstanding;
            const recovered = stack.totalRecovered;
            const issued = total + recovered;
            const pct = issued > 0 ? Math.round((recovered / issued) * 100) : 0;
            return (
              <button
                key={stack.debtorId}
                className={styles.debtorCard}
                onClick={() => navigate(`/loans/${stack.debtorId}`)}
              >
                <div className={styles.debtorCardTop}>
                  <div className={styles.debtorIcon} style={{ '--debtor-bg': stack.cpType === 'internal' ? ACCOUNT_TYPE_GRADIENT.business : ACCOUNT_TYPE_GRADIENT_THREE.counterparty } as React.CSSProperties}>
                    {stack.debtorName.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.debtorCardInfo}>
                    <span className={styles.debtorName}>{stack.debtorName}</span>
                    <span className={styles.debtorBadge}>
                      {stack.cpType === 'internal' ? 'Internal' : stack.cpType === 'creditor' ? 'Creditor' : 'Debtor'}
                    </span>
                  </div>
                  <span className={styles.debtorAmount}>{formatAmount(total, locale, currency)}</span>
                </div>
                <div className={styles.debtorMeta}>
                  <span>{stack.loans.length} loan{stack.loans.length !== 1 ? 's' : ''}</span>
                  <span>{pct}% repaid</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showAddCp && <AddCounterpartyForm onClose={() => setShowAddCp(false)} />}
    </div>
  );
}