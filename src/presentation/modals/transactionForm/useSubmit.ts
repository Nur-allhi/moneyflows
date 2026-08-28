import { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAccountStore } from '../../stores/useAccountStore';
import { useMemberStore } from '../../stores/useMemberStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useLoanStore } from '../../stores/useLoanStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTagStore } from '../../stores/useTagStore';
import { Transaction } from '../../../core/domain/Transaction';
import { validateForm, type ValidationErrors } from './validation';

export function useTxSubmit(params: {
  tab: string; rawAmount: string; description: string; source: string; destination: string;
  loanAction: 'lend' | 'repay'; selectedBorrowerId: string; date: string; tagName: string;
  accounts: ReturnType<typeof useAccountStore.getState>['accounts'];
  members: ReturnType<typeof useMemberStore.getState>['members'];
  setErrors: React.Dispatch<React.SetStateAction<ValidationErrors>>;
  onClose: () => void; setClosing: (v: boolean) => void;
  setDestination: (v: string) => void; setShowAddCp: (v: boolean) => void; setNewCpName: (v: string) => void; newCpName: string;
}) {
  const { tab, rawAmount, description, source, destination, loanAction, selectedBorrowerId, date, tagName, accounts, members, setErrors, onClose, setClosing, setDestination, setShowAddCp, setNewCpName, newCpName } = params;
  const { addTransaction } = useTransactionStore();
  const { createLoan, recordRepayment, createCounterparty, fetchLoanStacks } = useLoanStore();
  const { fetchAccounts } = useAccountStore();

  const validate = useCallback((): boolean => {
    const next = validateForm(tab, rawAmount, description, source, destination, accounts, loanAction, selectedBorrowerId);
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [tab, rawAmount, description, source, destination, accounts, loanAction, selectedBorrowerId, setErrors]);

  const handleCreateCp = async () => {
    if (!newCpName.trim()) return;
    try {
      const result = await createCounterparty(newCpName.trim());
      setDestination(result.accountId);
      setShowAddCp(false);
      setNewCpName('');
    } catch (e) {
      setErrors({ destination: e instanceof Error ? e.message : 'Could not create counterparty. Try again.' });
    }
  };

  const submitLockRef = useRef(false);

  const runSubmit = async () => {
    const amount = parseInt(rawAmount, 10);
    const primaryMemberId = useSettingsStore.getState().settings.primaryMemberId;
    const txMemberId = (primaryMemberId && members.find((m) => m.id === primaryMemberId && !m.isExternal)?.id)
      ?? members.find((m) => !m.isExternal)?.id ?? members[0]?.id ?? '';
    if (!txMemberId) { setErrors({ source: 'No family members found. Create a member first.' }); return; }
    if (tab === 'loan') {
      setClosing(true);
      try {
        if (loanAction === 'lend') {
          await createLoan({ lenderAccountId: source, borrowerAccountId: destination, amount, description: description.trim(), date, memberId: txMemberId });
        } else {
          await recordRepayment({ borrowerAccountId: selectedBorrowerId, amount, description: description.trim(), date, memberId: txMemberId, destinationAccountId: destination });
        }
        await fetchAccounts(); await fetchLoanStacks();
      } catch (e) { setErrors({ amount: (e as Error).message }); return; }
      setTimeout(() => onClose(), 300); return;
    }
    let type: Transaction['type']; let src: string | undefined; let dst: string | undefined; let debtorId: string | undefined;
    switch (tab) {
      case 'income': type = 'income'; dst = source; break;
      case 'expense': type = 'expense'; src = source; break;
      case 'transfer': type = 'transfer'; src = source; dst = destination; break;
      default: return;
    }
    const now = new Date(); const [y, m, d] = date.split('-');
    const dateTime = new Date(Number(y), Number(m) - 1, Number(d), now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
    const cleanDesc = description.trim(); const capitalizedDesc = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);
    const tx = new Transaction(uuidv4(), type, capitalizedDesc, amount, txMemberId, dateTime, src, dst, debtorId, undefined, tagName.trim() ? { tags: [tagName.trim()] } : {});
    await addTransaction(tx); await fetchAccounts();
    if (tagName.trim()) useTagStore.getState().addTag(tagName.trim());
    onClose();
  };

  const handleSubmit = async () => {
    if (submitLockRef.current) return;
    if (!validate()) return;
    submitLockRef.current = true;
    try { await runSubmit(); } finally { submitLockRef.current = false; }
  };

  return { validate, handleCreateCp, handleSubmit, submitLockRef };
}
