import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Modal, FormInput, FormSelect, AmountInput, FormField } from '../components';
import { DatePicker } from '../../components/ui/date-picker';
import { useAccountStore } from '../stores/useAccountStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { Account } from '../../core/domain/Account';
import { Transaction } from '../../core/domain/Transaction';
import type { AccountType } from '../../core/domain/Account';
import { ACCOUNT_TYPE_OPTIONS } from '../constants/labels';

interface AddAccountModalProps {
  memberId: string;
  onClose: () => void;
}

export function AddAccountModal({ memberId, onClose }: AddAccountModalProps) {
  const saveAccount = useAccountStore((s) => s.saveAccount);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [balance, setBalance] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const handleSave = async () => {
    if (!name.trim()) return;
    const account = new Account(
      uuidv4(), memberId, name.trim(), type, 0,
    );
    await saveAccount(account);
    if (balance && parseFloat(balance) > 0) {
      const tx = new Transaction(
        uuidv4(), 'income', 'Opening Balance', parseFloat(balance),
        memberId, date, undefined, account.id, undefined, undefined,
        { isOpeningBalance: true },
      );
      await addTransaction(tx);
    }
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title="Add Account" saveLabel="Add Account" onSave={handleSave}>
      <FormInput label="Account Name" placeholder="e.g. bKash, Brac Bank" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <FormSelect label="Account Type" value={type} onChange={(e) => setType(e.target.value as AccountType)}>
        {ACCOUNT_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </FormSelect>
      <AmountInput label="Initial Balance (optional)" value={balance} onChange={setBalance} placeholder="0" />
      {balance && parseFloat(balance) > 0 && (
        <FormField label="Opening Date">
          <DatePicker value={date} onChange={setDate} />
        </FormField>
      )}
    </Modal>
  );
}
