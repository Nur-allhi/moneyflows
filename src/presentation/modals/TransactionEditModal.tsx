import { useState, useEffect, useCallback } from 'react';
import { Modal, AmountInput, FormInput, FormField } from '../components';
import { DatePicker } from '../../components/ui/date-picker';
import { useTransactionStore } from '../stores/useTransactionStore';
import { Transaction } from '../../core/domain/Transaction';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import { useTagStore } from '../stores/useTagStore';
import styles from './TransactionEditModal.module.css';

interface TransactionEditModalProps {
  txId: string;
  onClose: () => void;
}

const editableTypes = ['income', 'expense'] as const;

export function TransactionEditModal({ txId, onClose }: TransactionEditModalProps) {
  const transaction = useTransactionStore((s) => s.transactions.find((t) => t.id === txId));
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const knownTags = useTagStore((s) => s.tags);

  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState('');
  const [txType, setTxType] = useState<string>('');
  const [tagName, setTagName] = useState('');

  const isOpeningBalance = (transaction?.metadata as Record<string, unknown>)?.isOpeningBalance === true;

  useEffect(() => {
    if (transaction) {
      setAmount(String(transaction.amount));
      setDesc(transaction.description);
      setDate(transaction.date.includes('T') ? transaction.date.slice(0, 10) : transaction.date);
      setTxType(transaction.type);
      setTagName(Array.isArray(transaction.metadata?.tags) ? String(transaction.metadata.tags[0] ?? '') : '');
    }
  }, [transaction]);

  const handleSave = useCallback(async () => {
    if (!transaction) return;
    const [y, m, d] = date.split('-');
    const now = new Date();
    const dateTime = new Date(Number(y), Number(m) - 1, Number(d), now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
    let sourceAccount = transaction.sourceAccount;
    let destAccount = transaction.destAccount;
    if (txType !== transaction.type && editableTypes.includes(transaction.type as typeof editableTypes[number]) && editableTypes.includes(txType as typeof editableTypes[number])) {
      if (txType === 'income') {
        destAccount = transaction.sourceAccount || transaction.destAccount;
        sourceAccount = undefined;
      } else {
        sourceAccount = transaction.destAccount || transaction.sourceAccount;
        destAccount = undefined;
      }
    }
    const metadata = { ...transaction.metadata };
    if (tagName.trim()) metadata.tags = [tagName.trim()];
    else delete metadata.tags;
    const updated = new Transaction(
      transaction.id, txType as Transaction['type'], desc.trim(), Number(amount), transaction.memberId, dateTime,
      sourceAccount, destAccount, transaction.debtorId, transaction.loanRef,
      metadata, transaction.createdAt,
    );
    await updateTransaction(transaction.id, updated);
    if (tagName.trim()) useTagStore.getState().addTag(tagName.trim());
    if (transaction.loanRef && (transaction.type === 'lend' || transaction.type === 'repay')) {
      try {
        const { LoanService } = await import('../../loans/application/LoanService');
        const service = new LoanService(getDatabase());
        await service.syncLoanTransaction(transaction.loanRef, transaction.amount, Number(amount), transaction.type);
      } catch { /* best-effort */ }
    }
    onClose();
  }, [transaction, amount, desc, date, txType, updateTransaction, onClose, tagName]);

  const showTypeToggle = editableTypes.includes(transaction?.type as typeof editableTypes[number]) && !isOpeningBalance;

  if (!transaction) return null;

  return (
    <Modal isOpen onClose={onClose} title="Edit Transaction" saveLabel="Save" onSave={handleSave}>
      <AmountInput label="Amount" value={amount} onChange={setAmount} placeholder="0" />
      <FormInput label="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
      <div className={styles.tagField}>
        <label className={styles.tagLabel}>Tag (optional)</label>
        <input
          className={styles.tagInput}
          list="tx-edit-tag-options"
          value={tagName}
          maxLength={30}
          placeholder="e.g. Travel, Medical"
          onChange={(e) => setTagName(e.target.value)}
        />
        <datalist id="tx-edit-tag-options">
          {knownTags.map((t) => <option key={t} value={t} />)}
        </datalist>
      </div>
      <FormField label="Date">
          <DatePicker value={date} onChange={setDate} />
        </FormField>
      {showTypeToggle && (
        <div className={styles.typeToggle}>
          <button
            onClick={() => setTxType('income')}
            className={`${styles.typeBtn} ${styles.income} ${txType === 'income' ? styles.active : ''}`}
          >
            Income (Credit)
          </button>
          <button
            onClick={() => setTxType('expense')}
            className={`${styles.typeBtn} ${styles.expense} ${txType === 'expense' ? styles.active : ''}`}
          >
            Expense (Debit)
          </button>
        </div>
      )}
    </Modal>
  );
}
