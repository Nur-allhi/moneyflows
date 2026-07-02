import { useState, useEffect, useCallback } from 'react';
import { Modal, AmountInput, FormInput } from '../components';
import { useTransactionStore } from '../stores/useTransactionStore';
import { Transaction } from '../../core/domain/Transaction';
import { getDatabase } from '../../infrastructure/database/getDatabase';

interface TransactionEditModalProps {
  txId: string;
  onClose: () => void;
}

export function TransactionEditModal({ txId, onClose }: TransactionEditModalProps) {
  const transaction = useTransactionStore((s) => s.transactions.find((t) => t.id === txId));
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);

  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (transaction) {
      setAmount(String(transaction.amount));
      setDesc(transaction.description);
      setDate(transaction.date.includes('T') ? transaction.date.slice(0, 10) : transaction.date);
    }
  }, [transaction]);

  if (!transaction) return null;

  const handleSave = useCallback(async () => {
    const [y, m, d] = date.split('-');
    const now = new Date();
    const dateTime = new Date(Number(y), Number(m) - 1, Number(d), now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
    const updated = new Transaction(
      transaction.id, transaction.type, desc.trim(), Number(amount), transaction.memberId, dateTime,
      transaction.sourceAccount, transaction.destAccount, transaction.debtorId, transaction.loanRef,
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
  }, [transaction, amount, desc, date, updateTransaction]);

  return (
    <Modal isOpen onClose={onClose} title="Edit Transaction" saveLabel="Save" onSave={handleSave}>
      <AmountInput label="Amount" value={amount} onChange={setAmount} placeholder="0" />
      <FormInput label="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
      <FormInput label="Date (YYYY-MM-DD)" value={date} onChange={(e) => setDate(e.target.value)} />
    </Modal>
  );
}
