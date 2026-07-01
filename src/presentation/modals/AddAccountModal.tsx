import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Modal, FormInput, FormSelect, AmountInput } from '../components';
import { useAccountStore } from '../stores/useAccountStore';
import { Account } from '../../core/domain/Account';
import type { AccountType } from '../../core/domain/Account';
import { ACCOUNT_TYPE_OPTIONS } from '../constants/labels';

interface AddAccountModalProps {
  memberId: string;
  onClose: () => void;
}

export function AddAccountModal({ memberId, onClose }: AddAccountModalProps) {
  const saveAccount = useAccountStore((s) => s.saveAccount);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [balance, setBalance] = useState('');

  const handleSave = async () => {
    if (!name.trim()) return;
    const account = new Account(
      uuidv4(), memberId, name.trim(), type,
      balance ? parseFloat(balance) || 0 : 0,
    );
    await saveAccount(account);
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
    </Modal>
  );
}
