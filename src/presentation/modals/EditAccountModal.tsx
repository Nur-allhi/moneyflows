import { useState, useEffect } from 'react';
import { Modal, FormInput, FormSelect } from '../components';
import { useAccountStore } from '../stores/useAccountStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { Account } from '../../core/domain/Account';
import type { AccountType } from '../../core/domain/Account';
import { ACCOUNT_TYPE_OPTIONS } from '../constants/labels';
import styles from './EditAccountModal.module.css';

interface EditAccountModalProps {
  accountId: string;
  onClose: () => void;
}

const LOAN_TYPES = new Set(['lend', 'repay', 'loan_issue', 'loan_repayment', 'loan_received', 'loan_paidback']);

export function EditAccountModal({ accountId, onClose }: EditAccountModalProps) {
  const account = useAccountStore((s) => s.accounts.find((a) => a.id === accountId));
  const saveAccount = useAccountStore((s) => s.saveAccount);
  const softDeleteAccount = useAccountStore((s) => s.softDeleteAccount);
  const transactions = useTransactionStore((s) => s.transactions);

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setType(account.type);
      setConfirmDelete(false);
      setError(null);
    }
  }, [account]);

  if (!account) return null;

  const linkedTxs = transactions.filter((t) => t.sourceAccount === accountId || t.destAccount === accountId);
  const loanTxCount = linkedTxs.filter((t) => LOAN_TYPES.has(t.type)).length;
  const txCount = linkedTxs.length;

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Account name is required');
      return;
    }
    const updated = new Account(
      account.id, account.memberId, name.trim(), type, account.balance,
      account.currency, account.icon, account.color, account.isActive,
      account.metadata, account.createdAt,
    );
    await saveAccount(updated);
    onClose();
  };

  const handleDelete = async () => {
    await softDeleteAccount(accountId);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title="Edit Account" saveLabel="Save" onSave={handleSave}>
      <FormInput label="Account Name" placeholder="e.g. bKash, Brac Bank" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <FormSelect label="Account Type" value={type} onChange={(e) => setType(e.target.value as AccountType)}>
        {ACCOUNT_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </FormSelect>
      {error && <p className={styles.errorText}>{error}</p>}

      <div className={styles.dangerZone}>
        {!confirmDelete ? (
          <>
            <p className={styles.dangerHint}>
              {txCount > 0
                ? `${txCount} transaction${txCount === 1 ? '' : 's'} ${txCount === 1 ? 'references' : 'reference'} this account${loanTxCount > 0 ? ` (${loanTxCount} loan movement${loanTxCount === 1 ? '' : 's'})` : ''}. `
                : 'No transactions reference this account. '}
              Deleting moves it to the Recycle Bin — restorable for 30 days.
            </p>
            <button className={styles.deleteBtn} onClick={() => setConfirmDelete(true)}>Delete Account</button>
          </>
        ) : (
          <div className={styles.confirmRow}>
            <span className={styles.confirmText}>Are you sure?</span>
            <button className={styles.cancelBtn} onClick={() => setConfirmDelete(false)}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleDelete}>Yes, delete</button>
          </div>
        )}
      </div>
    </Modal>
  );
}
