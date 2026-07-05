import { useState, useEffect, useCallback } from 'react';
import { Modal, AmountInput, FormInput, FormField } from '../components';
import { DatePicker } from '../../components/ui/date-picker';
import { useTransactionStore } from '../stores/useTransactionStore';
import { Transaction } from '../../core/domain/Transaction';
import { getDatabase } from '../../infrastructure/database/getDatabase';

interface TransactionEditModalProps {
  txId: string;
  onClose: () => void;
}

const editableTypes = ['income', 'expense'] as const;

export function TransactionEditModal({ txId, onClose }: TransactionEditModalProps) {
  const transaction = useTransactionStore((s) => s.transactions.find((t) => t.id === txId));
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);

  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState('');
  const [txType, setTxType] = useState<string>('');

  const isOpeningBalance = (transaction?.metadata as Record<string, unknown>)?.isOpeningBalance === true;

  useEffect(() => {
    if (transaction) {
      setAmount(String(transaction.amount));
      setDesc(transaction.description);
      setDate(transaction.date.includes('T') ? transaction.date.slice(0, 10) : transaction.date);
      setTxType(transaction.type);
    }
  }, [transaction]);

  if (!transaction) return null;

  const handleSave = useCallback(async () => {
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
    const updated = new Transaction(
      transaction.id, txType as Transaction['type'], desc.trim(), Number(amount), transaction.memberId, dateTime,
      sourceAccount, destAccount, transaction.debtorId, transaction.loanRef,
      transaction.metadata, transaction.createdAt,
    );
    await updateTransaction(transaction.id, updated);
    if (transaction.loanRef && (transaction.type === 'lend' || transaction.type === 'repay')) {
      try {
        const { LoanService } = await import('../../loans/application/LoanService');
        const service = new LoanService(getDatabase());
        await service.syncLoanTransaction(transaction.loanRef, transaction.amount, Number(amount), transaction.type);
      } catch { /* best-effort */ }
    }
    onClose();
  }, [transaction, amount, desc, date, txType, updateTransaction]);

  const showTypeToggle = editableTypes.includes(transaction.type as typeof editableTypes[number]) && !isOpeningBalance;

  return (
    <Modal isOpen onClose={onClose} title="Edit Transaction" saveLabel="Save" onSave={handleSave}>
      <AmountInput label="Amount" value={amount} onChange={setAmount} placeholder="0" />
      <FormInput label="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
      <FormField label="Date">
          <DatePicker value={date} onChange={setDate} />
        </FormField>
      {showTypeToggle && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={() => setTxType('income')}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 14,
              background: txType === 'income' ? '#22c55e' : 'var(--bg-secondary, #2a2a2a)',
              color: txType === 'income' ? '#fff' : 'var(--text-secondary, #aaa)',
            }}
          >
            Income (Credit)
          </button>
          <button
            onClick={() => setTxType('expense')}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 14,
              background: txType === 'expense' ? '#ef4444' : 'var(--bg-secondary, #2a2a2a)',
              color: txType === 'expense' ? '#fff' : 'var(--text-secondary, #aaa)',
            }}
          >
            Expense (Debit)
          </button>
        </div>
      )}
    </Modal>
  );
}
