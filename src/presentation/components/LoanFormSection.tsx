import { useState } from 'react';
import type { Account } from '../../core/domain/Account';
import styles from './LoanFormSection.module.css';

export type LoanMode = 'give' | 'take' | 'repay' | 'payback';

export const LOAN_MODE_LABELS: Record<LoanMode, string> = {
  give: 'Give',
  take: 'Take',
  repay: 'Repay',
  payback: 'Pay Back',
};

export const LOAN_MODE_BUTTON_LABELS: Record<LoanMode, string> = {
  give: 'Issue Loan',
  take: 'Record Loan Received',
  repay: 'Record Repayment',
  payback: 'Record Payback',
};

export interface LoanFormSectionProps {
  mode: LoanMode;
  onModeChange: (mode: LoanMode) => void;
  counterpartyId: string;
  onCounterpartyChange: (id: string) => void;
  counterpartyAccounts: Account[];
  onAddCounterparty: (name: string, type: 'debtor' | 'creditor') => Promise<string>;
  onOpenPicker: () => void;
  error?: string;
  onClearError: () => void;
}

export function LoanFormSection({
  mode, onModeChange,
  counterpartyId, onCounterpartyChange,
  counterpartyAccounts, onAddCounterparty,
  onOpenPicker,
  error, onClearError,
}: LoanFormSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const counterpartyType: 'debtor' | 'creditor' =
    mode === 'take' || mode === 'payback' ? 'creditor' : 'debtor';

  const counterpartyLabel = counterpartyType === 'debtor' ? 'Debtor' : 'Creditor';

  const filteredAccounts = counterpartyAccounts.filter(
    (a) => (a.metadata?.counterpartyType as string) === counterpartyType
  );

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const id = await onAddCounterparty(newName.trim(), counterpartyType);
      onCounterpartyChange(id);
      setShowAddForm(false);
      setNewName('');
    } catch {
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.modeStrip}>
        {(Object.keys(LOAN_MODE_LABELS) as LoanMode[]).map((m) => (
          <button
            key={m}
            type="button"
            className={`${styles.modeBtn} ${m === mode ? styles.modeActive : ''}`}
            onClick={() => { onModeChange(m); onClearError(); }}
          >
            {LOAN_MODE_LABELS[m]}
          </button>
        ))}
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>{counterpartyLabel}</span>
        <div className={styles.counterpartyRow}>
          <button
            type="button"
            className={`${styles.pickerTrigger} ${error ? styles.fieldError : ''}`}
            onClick={onOpenPicker}
          >
            {counterpartyId
              ? <><span className={styles.pickerValue}>{counterpartyAccounts.find(a => a.id === counterpartyId)?.name ?? 'Select'}</span><span className={styles.pickerArrow}>{'\u25BE'}</span></>
              : <span className={styles.pickerPlaceholder}>Select {counterpartyLabel}</span>}
          </button>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setShowAddForm(!showAddForm)}
            title={`Add ${counterpartyLabel}`}
          >
            +
          </button>
        </div>
        {filteredAccounts.length === 0 && (
          <span className={styles.hint}>No {counterpartyLabel} accounts yet. Use + to add one.</span>
        )}
        {error && <span className={styles.errorText}>{error}</span>}
      </div>

      {showAddForm && (
        <div className={styles.addForm}>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Name</span>
            <input
              className={styles.addInput}
              placeholder="Full name"
              value={newName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
            />
          </div>
          <button
            type="button"
            className={styles.addSubmitBtn}
            onClick={handleAdd}
            disabled={!newName.trim() || adding}
          >
            {adding ? 'Creating...' : `Create ${counterpartyLabel}`}
          </button>
        </div>
      )}

      <p className={styles.hint}>
        {mode === 'give' && 'Money leaves the source account to the counterparty.'}
        {mode === 'take' && 'Money enters the destination account from the counterparty.'}
        {mode === 'repay' && 'Repayment from counterparty to the destination account.'}
        {mode === 'payback' && 'Pay back from the source account to the counterparty.'}
      </p>
    </div>
  );
}