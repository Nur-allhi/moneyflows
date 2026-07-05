import { useState, useMemo, useCallback } from 'react';
import { useLoanStore } from '../stores/useLoanStore';
import { useAccountStore } from '../../../presentation/stores/useAccountStore';
import { useSettingsStore } from '../../../presentation/stores/useSettingsStore';
import { formatAmount } from '../../../presentation/utils/format';
import { AddCounterparty } from './AddCounterparty';
import styles from './LoanForm.module.css';

interface LoanFormProps {
  initialAction?: 'lend' | 'repay';
  initialLenderAccountId?: string;
  initialBorrowerAccountId?: string;
  onClose: () => void;
}

export function LoanForm({ initialAction, initialLenderAccountId, initialBorrowerAccountId, onClose }: LoanFormProps) {
  const [action, setAction] = useState<'lend' | 'repay'>(initialAction ?? 'lend');
  const [lenderAccountId, setLenderAccountId] = useState(initialLenderAccountId ?? '');
  const [borrowerAccountId, setBorrowerAccountId] = useState(initialBorrowerAccountId ?? '');
  const [selectedBorrowerId, setSelectedBorrowerId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const { accounts, fetchAccounts } = useAccountStore();
  const { loanStacks, createLoan, recordRepayment, fetchLoanStacks } = useLoanStore();
  const { locale, currency } = useSettingsStore((s) => s.settings);

  const activeAccounts = useMemo(() => accounts.filter((a) => a.isActive), [accounts]);
  const lenderAccounts = useMemo(() => activeAccounts.filter((a) => a.type !== 'counterparty'), [activeAccounts]);

  const repayStackOptions = useMemo(() => {
    return loanStacks
      .filter((s) => s.totalOutstanding > 0)
      .map((s) => ({
        borrowerId: s.debtorId,
        label: `${s.debtorName} - ${formatAmount(s.totalOutstanding, locale, currency)}`,
      }));
  }, [loanStacks, locale, currency]);

  const showAddCp = borrowerAccountId === '__new__';

  const dateStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  const handleSubmit = useCallback(async () => {
    setErr('');
    if (action === 'repay') {
      if (!selectedBorrowerId) { setErr('Select a counterparty to repay'); return; }
    } else {
      if (!lenderAccountId || !borrowerAccountId) { setErr('Select both accounts'); return; }
    }
    const amt = parseInt(amount, 10);
    if (!amt || amt <= 0) { setErr('Enter a valid amount'); return; }
    if (!description.trim()) { setErr('Enter a description'); return; }

    setSaving(true);
    try {
      if (action === 'lend') {
        const txMemberId = accounts.find((a) => a.id === lenderAccountId)?.memberId ?? '';
        await createLoan({
          lenderAccountId, borrowerAccountId, amount: amt,
          description: description.trim(), date: dateStr, memberId: txMemberId,
        });
      } else {
        const stack = loanStacks.find((s) => s.debtorId === selectedBorrowerId);
        const lenderAcct = stack ? accounts.find((a) => a.type !== 'counterparty') : undefined;
        const txMemberId = lenderAcct?.memberId ?? '';
        await recordRepayment({
          borrowerAccountId: selectedBorrowerId, amount: amt,
          description: description.trim(), date: dateStr, memberId: txMemberId,
        });
      }
      await fetchAccounts();
      await fetchLoanStacks();
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [action, lenderAccountId, borrowerAccountId, selectedBorrowerId, amount, description, dateStr, accounts, loanStacks, createLoan, recordRepayment, fetchAccounts, fetchLoanStacks, onClose]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Loan Action</h2>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
      </div>

      <div className={styles.actionStrip}>
        <button
          className={`${styles.actionBtn} ${action === 'lend' ? styles.actionActive : ''}`}
          onClick={() => setAction('lend')}
        >
          Lend Money
        </button>
        <button
          className={`${styles.actionBtn} ${action === 'repay' ? styles.actionActive : ''}`}
          onClick={() => setAction('repay')}
        >
          Record Repayment
        </button>
      </div>

      {action === 'repay' ? (
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Counterparty</span>
          <select
            className={styles.select}
            value={selectedBorrowerId}
            onChange={(e) => setSelectedBorrowerId(e.target.value)}
          >
            <option value="">Select counterparty</option>
            {repayStackOptions.map((opt) => (
              <option key={opt.borrowerId} value={opt.borrowerId}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>From Account</span>
            <select
              className={styles.select}
              value={lenderAccountId}
              onChange={(e) => setLenderAccountId(e.target.value)}
            >
              <option value="">Select account</option>
              {lenderAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} - {formatAmount(a.balance, locale, currency)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>To Account</span>
            <div className={styles.toRow}>
              <select
                className={styles.select}
                value={borrowerAccountId}
                onChange={(e) => setBorrowerAccountId(e.target.value)}
              >
                <option value="">Select account</option>
                {activeAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} - {formatAmount(a.balance, locale, currency)}
                  </option>
                ))}
                <option value="__new__">+ Create new counterparty</option>
              </select>
            </div>
          </div>

          {showAddCp && (
            <AddCounterparty
              onCreated={(id) => { setBorrowerAccountId(id); }}
              onCancel={() => setBorrowerAccountId('')}
            />
          )}
        </>
      )}

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Amount</span>
        <input
          className={styles.input}
          type="number"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
        />
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Description</span>
        <input
          className={styles.input}
          placeholder="What's this for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {err && <span className={styles.error}>{err}</span>}

      <button
        className={styles.submitBtn}
        onClick={handleSubmit}
        disabled={saving}
      >
        {saving ? 'Processing...' : action === 'lend' ? 'Confirm Loan' : 'Confirm Repayment'}
      </button>
    </div>
  );
}
