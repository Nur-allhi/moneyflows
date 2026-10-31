import { useState, useEffect, useCallback } from 'react';
import { Modal, AmountInput, FormInput, FormField } from '../components';
import { DatePicker } from '../../components/ui/date-picker';
import { useTransactionStore } from '../stores/useTransactionStore';
import { Transaction } from '../../core/domain/Transaction';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import { useTagStore } from '../stores/useTagStore';
import {
  parseAmountInput,
  validateTransactionFields,
  type TransactionFieldIssues,
} from '../../core/domain/transactionRules';
import { useReplay } from '../hooks/useReplay';
import { useSettingsStore } from '../stores/useSettingsStore';
import { formatAmount } from '../utils/format';
import { RepaymentEditError } from '../../loans/domain/errors';
import { readAllocations } from '../../loans/domain/repaymentAllocations';
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
  const [errors, setErrors] = useState<TransactionFieldIssues>({});
  const [formError, setFormError] = useState<string | null>(null);

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
    // Check the fields BEFORE writing anything, and keep the modal open when
    // they fail: it used to close unconditionally, so a rejected save looked
    // like a successful one (BUG-24).
    const amountNum = parseAmountInput(amount);
    const issues = validateTransactionFields({ amount: amountNum, description: desc, date });
    if (issues.amount || issues.description || issues.date) {
      setErrors(issues);
      setFormError(null);
      return;
    }
    setErrors({});
    setFormError(null);
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
      transaction.id, txType as Transaction['type'], desc.trim(), amountNum, transaction.memberId, dateTime,
      sourceAccount, destAccount, transaction.debtorId, transaction.loanRef,
      metadata, transaction.createdAt,
    );
    // An edit to a repayment can be refused by the loans it pays (BUG-40). What
    // can be checked depends on what the repayment recorded: one that stored its
    // split can be reversed exactly (BUG-47), one with only a `loanRef` can only
    // be judged against that single loan. This runs BEFORE the transaction is
    // written: the save and the loan sync are separate steps, so checking
    // afterwards would leave the new amount on the ledger with the loan record
    // clamped, which is the bug this guards.
    const allocations = readAllocations(transaction.metadata);
    const paysLoans = transaction.type === 'repay' && (!!transaction.loanRef || allocations.length > 0);
    if (paysLoans && amountNum !== transaction.amount) {
      try {
        const { LoanService } = await import('../../loans/application/LoanService');
        await new LoanService(getDatabase())
          .assertRepaymentEditAllowed(transaction.loanRef, transaction.amount, amountNum, allocations);
      } catch (e) {
        const { locale, currency } = useSettingsStore.getState().settings;
        setFormError(e instanceof RepaymentEditError
          ? `Only ${formatAmount(e.room, locale, currency)} is still owed ${e.scope === 'loans' ? 'across these loans' : 'on this loan'} — the repayment can be raised to at most ${formatAmount(e.limit, locale, currency)}.`
          : (e as Error).message);
        return;
      }
    }
    await updateTransaction(transaction.id, updated);
    // The store rolls back and records the reason rather than throwing, so read
    // it back — otherwise a save the database refused still closes the modal.
    const failure = useTransactionStore.getState().error;
    if (failure) {
      setFormError(failure);
      return;
    }
    if (tagName.trim()) useTagStore.getState().addTag(tagName.trim());
    const touchesLoans = transaction.type === 'lend'
      ? !!transaction.loanRef
      : transaction.type === 'repay' && (!!transaction.loanRef || allocations.length > 0);
    if (touchesLoans) {
      try {
        const { LoanService } = await import('../../loans/application/LoanService');
        const service = new LoanService(getDatabase());
        await service.syncLoanTransaction(transaction.loanRef, transaction.amount, amountNum, transaction.type, allocations);
      } catch { /* best-effort */ }
    }
    onClose();
  }, [transaction, amount, desc, date, txType, updateTransaction, onClose, tagName]);

  const showTypeToggle = editableTypes.includes(transaction?.type as typeof editableTypes[number]) && !isOpeningBalance;
  const [incomeKey, replayIncome] = useReplay();
  const [expenseKey, replayExpense] = useReplay();

  if (!transaction) return null;

  return (
    <Modal isOpen onClose={onClose} title="Edit Transaction" saveLabel="Save" onSave={handleSave}>
      <AmountInput label="Amount" value={amount} error={errors.amount} onChange={(v) => { setAmount(v); setErrors((prev) => ({ ...prev, amount: undefined })); }} placeholder="0" />
      <FormInput label="Description" value={desc} error={errors.description} onChange={(e) => { setDesc(e.target.value); setErrors((prev) => ({ ...prev, description: undefined })); }} />
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
      <FormField label="Date" error={errors.date}>
          <DatePicker value={date} onChange={setDate} />
        </FormField>
      {formError && <span className={styles.formError}>{formError}</span>}
      {showTypeToggle && (
        <div className={styles.typeToggle}>
          <button
            onClick={() => { replayIncome(); setTxType('income'); }}
            className={`${styles.typeBtn} ${styles.income} ${txType === 'income' ? styles.active : ''} ${incomeKey > 0 ? 'anim-pop' : ''}`}
          >
            <span className="anim-target" key={incomeKey}>Income (Credit)</span>
          </button>
          <button
            onClick={() => { replayExpense(); setTxType('expense'); }}
            className={`${styles.typeBtn} ${styles.expense} ${txType === 'expense' ? styles.active : ''} ${expenseKey > 0 ? 'anim-pop' : ''}`}
          >
            <span className="anim-target" key={expenseKey}>Expense (Debit)</span>
          </button>
        </div>
      )}
    </Modal>
  );
}
