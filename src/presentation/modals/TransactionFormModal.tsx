import { useState, useEffect, useMemo, useCallback } from 'react';

import { useAccountStore } from '../stores/useAccountStore';
import { useMemberStore } from '../stores/useMemberStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useLoanStore } from '../stores/useLoanStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTagStore } from '../stores/useTagStore';
import { formatAmount } from '../utils/format';

import type { Account } from '../../core/domain/Account';
import type { ValidationErrors } from './transactionForm/validation';
import { FormFields } from './transactionForm/formFields';
import { SourceDestinationPickers, BorrowerPicker } from './transactionForm/pickers';
import { TransactionFormLayout } from './transactionForm/layout';
import { EmptyAccountsState, ErrorState, LoadingState } from './transactionForm/states';
import { TagPicker, CreatePersonModal } from './transactionForm/extraPickers';
import { useTxSubmit } from './transactionForm/useSubmit';

interface TransactionFormModalProps {
  onClose: () => void;
  initialSource?: string;
  initialDestination?: string;
  initialTab?: string;
  initialBorrowerId?: string;
}

const tabs = [
  { key: 'income', label: 'Income' },
  { key: 'expense', label: 'Expense' },
  { key: 'transfer', label: 'Transfer' },
  { key: 'loan', label: 'Loan' },
];

export function TransactionFormModal({
  onClose,
  initialSource,
  initialDestination,
  initialTab,
  initialBorrowerId,
}: TransactionFormModalProps) {
  const { accounts, loading: acctLoading, error: acctError, fetchAccounts } = useAccountStore();
  const { members, loading: memberLoading, fetchMembers } = useMemberStore();
  const { error: txError } = useTransactionStore();
  const { loanStacks, fetchLoanStacks } = useLoanStore();
  const { locale, currency } = useSettingsStore((s) => s.settings);

  const [tab, setTab] = useState(initialTab ?? 'transfer');
  const [rawAmount, setRawAmount] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState(initialSource ?? '');
  const [destination, setDestination] = useState(initialDestination ?? '');
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [closing, setClosing] = useState(false);

  const [pickerField, setPickerField] = useState<'source' | 'destination' | null>(null);
  const [pickerMember, setPickerMember] = useState<string | null>(null);

  const [loanAction, setLoanAction] = useState<'lend' | 'repay'>(initialTab === 'loan' && initialBorrowerId ? 'repay' : 'lend');
  const [selectedBorrowerId, setSelectedBorrowerId] = useState(initialBorrowerId ?? '');
  const [showAddCp, setShowAddCp] = useState(false);
  const [newCpName, setNewCpName] = useState('');
  const [tagName, setTagName] = useState('');
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const knownTags = useTagStore((s) => s.tags);
  const [showBorrowerPicker, setShowBorrowerPicker] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchMembers();
    fetchLoanStacks();
  }, [fetchAccounts, fetchMembers, fetchLoanStacks]);

  const memberLookup = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])),
    [members],
  );

  const internalMembers = useMemo(
    () => members.filter((m) => !m.isExternal),
    [members],
  );

  const accountsByMember = useMemo(
    () => {
      const map: Record<string, Account[]> = {};
      for (const a of accounts) {
        if (!a.memberId) continue;
        const list = map[a.memberId] ?? [];
        list.push(a);
        map[a.memberId] = list;
      }
      return map;
    },
    [accounts],
  );

  const counterpartyAccounts = useMemo(
    () => accounts.filter((a) => a.type === 'counterparty'),
    [accounts],
  );

  const accountLabel = useCallback((id: string) => {
    const a = accounts.find(a => a.id === id);
    if (!a) return '';
    if (!a.memberId) return a.name;
    const memberName = memberLookup[a.memberId]?.name ?? '';
    return memberName ? `${a.name} \u2014 ${memberName}` : a.name;
  }, [accounts, memberLookup]);

  const displayAmount = rawAmount ? Intl.NumberFormat(locale).format(parseInt(rawAmount, 10)) : '';

  const insufficientWarning = useMemo(() => {
    if (tab === 'income') return null;
    const accountId = (tab === 'loan' && loanAction === 'repay') ? selectedBorrowerId : source;
    if (!accountId) return null;
    const amt = parseInt(rawAmount, 10);
    if (isNaN(amt) || amt <= 0) return null;
    const acct = accounts.find((a) => a.id === accountId);
    if (!acct || amt <= acct.balance) return null;
    return { available: acct.balance, deficit: amt - acct.balance, accountId };
  }, [tab, loanAction, source, selectedBorrowerId, rawAmount, accounts]);

  const repayStackOptions = useMemo(() => {
    return loanStacks
      .filter((s) => s.totalOutstanding > 0)
      .map((s) => ({
        borrowerId: s.debtorId,
        label: `${s.debtorName} - ${formatAmount(s.totalOutstanding, locale, currency)}`,
      }));
  }, [loanStacks, locale, currency]);

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^0-9]/g, '');
    setRawAmount(cleaned);
  };

  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      document.getElementById('tx-description')?.focus();
    }
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onClose(), 300);
  };

  const { handleSubmit, handleCreateCp } = useTxSubmit({
    tab, rawAmount, description, source, destination, loanAction, selectedBorrowerId, date, tagName,
    accounts, members, setErrors, onClose, setClosing, setDestination, setShowAddCp, setNewCpName, newCpName,
  });

  const loading = acctLoading || memberLoading;
  const emptyAccounts = !loading && !acctError && accounts.length === 0;

  if (emptyAccounts) return <EmptyAccountsState onClose={handleClose} />;
  if (acctError) return <ErrorState error={acctError} onRetry={() => { fetchAccounts(); fetchMembers(); }} onClose={handleClose} />;
  if (loading) return <LoadingState onClose={handleClose} />;

  const buttonLabel =
    tab === 'income' ? 'Complete Income' :
    tab === 'expense' ? 'Complete Expense' :
    tab === 'transfer' ? 'Complete Transfer' :
    loanAction === 'lend' ? 'Confirm Loan' : 'Confirm Repayment';

  const formFields = (
    <FormFields
      tab={tab}
      loanAction={loanAction}
      setLoanAction={setLoanAction}
      rawAmount={rawAmount}
      displayAmount={displayAmount}
      onAmountChange={handleAmountChange}
      onAmountKeyDown={handleAmountKeyDown}
      currency={currency}
      errors={errors}
      date={date}
      setDate={setDate}
      source={source}
      destination={destination}
      setPickerField={setPickerField}
      setPickerMember={setPickerMember}
      accountLabel={accountLabel}
      description={description}
      setDescription={setDescription}
      clearError={clearError}
      tagName={tagName}
      setShowTagPicker={setShowTagPicker}
      insufficientWarning={insufficientWarning}
      handleClose={handleClose}
      formatAmount={formatAmount}
      locale={locale}
      setShowBorrowerPicker={setShowBorrowerPicker}
      selectedBorrowerId={selectedBorrowerId}
      repayStackOptions={repayStackOptions}
      txError={txError}
    />
  );

  return (
    <>
      <TransactionFormLayout
        tab={tab}
        setTab={setTab}
        tabs={tabs}
        formFields={formFields}
        buttonLabel={buttonLabel}
        handleSubmit={handleSubmit}
        handleClose={handleClose}
        closing={closing}
        rawAmount={rawAmount}
        errors={errors}
      />

      <TagPicker show={showTagPicker} onClose={() => setShowTagPicker(false)} setTagName={setTagName} newTagName={newTagName} setNewTagName={setNewTagName} knownTags={knownTags} />

      <BorrowerPicker
        show={showBorrowerPicker}
        onClose={() => setShowBorrowerPicker(false)}
        repayStackOptions={repayStackOptions}
        selectedBorrowerId={selectedBorrowerId}
        setSelectedBorrowerId={setSelectedBorrowerId}
      />
      <SourceDestinationPickers
        pickerField={pickerField}
        pickerMember={pickerMember}
        setPickerField={setPickerField}
        setPickerMember={setPickerMember}
        internalMembers={internalMembers}
        accountsByMember={accountsByMember}
        counterpartyAccounts={counterpartyAccounts}
        onSelectSource={(id) => setSource(id)}
        onSelectDestination={(id) => setDestination(id)}
        setShowAddCp={setShowAddCp}
        clearError={clearError}
        locale={locale}
        currency={currency}
        tab={tab}
      />

      <CreatePersonModal show={showAddCp} onClose={() => setShowAddCp(false)} newCpName={newCpName} setNewCpName={(v) => { setNewCpName(v); if (errors.destination) setErrors((p) => ({ ...p, destination: '' })); }} onCreate={handleCreateCp} error={errors.destination} />
    </>
  );
}
