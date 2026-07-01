import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { SegmentedTabs, FormTextarea, Numpad } from '../components';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import { DatePicker } from '../../components/ui/date-picker';
import { useAccountStore } from '../stores/useAccountStore';
import { useMemberStore } from '../stores/useMemberStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { formatAmount } from '../utils/format';
import { Transaction } from '../../core/domain/Transaction';
import type { Member } from '../../core/domain/Member';
import type { Account } from '../../core/domain/Account';
import styles from './TransactionWizard.module.css';

const tabs = [
  { key: 'income', label: 'Income' },
  { key: 'expense', label: 'Expense' },
  { key: 'transfer', label: 'Transfer' },
  { key: 'loan', label: 'Loan' },
];

type ValidationErrors = Record<string, string>;

function validateForm(
  tab: string,
  rawAmount: string,
  description: string,
  source: string,
  destination: string,
  debtor: string,
  accounts: Account[],
  externalMembers: Member[],
  locale: string,
  currency: string,
): ValidationErrors {
  const next: ValidationErrors = {};
  const amountNum = parseInt(rawAmount, 10);

  if (!rawAmount || rawAmount.trim() === '') {
    next.amount = 'Amount is required';
  } else if (isNaN(amountNum) || !isFinite(amountNum) || amountNum <= 0) {
    next.amount = 'Amount must be a positive number';
  }

  const desc = description.trim();
  if (desc.length < 1) {
    next.description = 'Description is required';
  } else if (desc.length > 200) {
    next.description = 'Description must be 200 characters or less';
  }

  if (!source) {
    next.source = 'Select an account';
  } else {
    const acct = accounts.find((a) => a.id === source);
    if (!acct) next.source = 'Account not found';
    else if (!acct.isActive) next.source = 'Account is inactive';
  }

  if (tab === 'transfer') {
    if (!destination) {
      next.destination = 'Select a destination account';
    } else if (source && destination === source) {
      next.destination = 'Source and destination must differ';
    } else {
      const acct = accounts.find((a) => a.id === destination);
      if (!acct) next.destination = 'Account not found';
      else if (!acct.isActive) next.destination = 'Account is inactive';
    }
  }

  if (tab === 'loan') {
    if (!debtor) {
      next.debtor = 'Select a debtor';
    } else if (!externalMembers.find((m) => m.id === debtor)) {
      next.debtor = 'Debtor not found';
    }
  }

  if (source && tab !== 'income' && !isNaN(amountNum) && amountNum > 0) {
    const srcAcct = accounts.find((a) => a.id === source);
    if (srcAcct && amountNum > srcAcct.balance && tab !== 'loan') {
      next.amount = `Insufficient balance (${formatAmount(srcAcct.balance, locale, currency)} available)`;
    }
  }

  return next;
}

export function TransactionWizard() {
  const navigate = useNavigate();
  const { accounts, loading: acctLoading, error: acctError, fetchAccounts } = useAccountStore();
  const { members, loading: memberLoading, fetchMembers } = useMemberStore();
  const { addTransaction, error: txError } = useTransactionStore();
  const { locale, currency } = useSettingsStore((s) => s.settings);

  const [tab, setTab] = useState('transfer');
  const [rawAmount, setRawAmount] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [debtor, setDebtor] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchMembers();
  }, []);

  const externalMembers = useMemo(
    () => members.filter((m) => m.isExternal),
    [members],
  );

  const memberLookup = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])),
    [members],
  );

  const debtorOptions = useMemo(
    () => externalMembers.map((m) => ({
      value: m.id,
      label: `${m.name}${m.shortName ? ` (${m.shortName})` : ''}`,
    })),
    [externalMembers],
  );

  const accountOptionLabel = useCallback((id: string) => {
    const a = accounts.find(a => a.id === id);
    if (!a) return '';
    return `${memberLookup[a.memberId]?.name ?? '?'} \u2192 ${a.name}`;
  }, [accounts, memberLookup]);

  const displayAmount = rawAmount ? Intl.NumberFormat(locale).format(parseInt(rawAmount, 10)) : '';

  const validate = useCallback((): boolean => {
    const next = validateForm(tab, rawAmount, description, source, destination, debtor, accounts, externalMembers, locale, currency);
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [tab, rawAmount, description, source, destination, debtor, accounts, externalMembers, locale, currency]);

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  }, []);

  const handleNumpadInput = useCallback((digit: string) => {
    setRawAmount((prev) => {
      const next = prev + digit;
      return next.length > 10 ? prev : next;
    });
  }, []);

  const handleNumpadBackspace = useCallback(() => {
    setRawAmount((prev) => prev.slice(0, -1) || '');
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^0-9]/g, '');
    setRawAmount(cleaned);
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => navigate(-1), 300);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const amount = parseInt(rawAmount, 10);
    const txMemberId = members.find((m) => !m.isExternal && m.shortName === 'Efty')?.id
      ?? members.find((m) => !m.isExternal)?.id
      ?? members[0]?.id
      ?? '';
    if (!txMemberId) {
      setErrors({ source: 'No family members found. Create a member first.' });
      return;
    }

    let type: Transaction['type'];
    let src: string | undefined;
    let dst: string | undefined;
    let debtorId: string | undefined;

    switch (tab) {
      case 'income':
        type = 'income';
        dst = source;
        break;
      case 'expense':
        type = 'expense';
        src = source;
        break;
      case 'transfer':
        type = 'transfer';
        src = source;
        dst = destination;
        break;
      case 'loan':
        type = 'loan_issue';
        src = source;
        debtorId = debtor;
        break;
      default:
        return;
    }

    const tx = new Transaction(
      uuidv4(), type, description.trim(), amount, txMemberId, date, src, dst, debtorId,
    );

    await addTransaction(tx);
    await fetchAccounts();
    navigate(-1);
  };

  const loading = acctLoading || memberLoading;
  const emptyAccounts = !loading && !acctError && accounts.length === 0;

  if (emptyAccounts) {
    return (
      <>
        <div className={styles.mobileLayout}>
          <div className={styles.wizard}>
            <div className={styles.sheet}>
              <div className={styles.handle} />
              <div className={styles.header}>
                <h2>New Transaction</h2>
                <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">&times;</button>
              </div>
              <div className="empty-state">
                <div className="empty-state-icon">{'\u{1F4B0}'}</div>
                <p className="empty-state-text">No accounts available</p>
                <button className="retry-btn" onClick={() => navigate(-1)}>Go Back</button>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.desktopLayout}>
          <div className={styles.desktopOverlay} onClick={handleClose} />
          <div className={styles.desktopModal}>
            <div className={styles.modalHeader}>
              <h2>New Transaction</h2>
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">&times;</button>
            </div>
            <div className="empty-state">
              <div className="empty-state-icon">{'\u{1F4B0}'}</div>
              <p className="empty-state-text">No accounts available</p>
              <button className="retry-btn" onClick={() => navigate(-1)}>Go Back</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (acctError) {
    return (
      <>
        <div className={styles.mobileLayout}>
          <div className={styles.wizard}>
            <div className={styles.sheet}>
              <div className={styles.handle} />
              <div className={styles.header}>
                <h2>New Transaction</h2>
                <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">&times;</button>
              </div>
              <div className="error-state">
                <div className="error-state-icon">{'\u26A0\uFE0F'}</div>
                <p className="error-state-text">{acctError}</p>
                <button className="retry-btn" onClick={() => { fetchAccounts(); fetchMembers(); }}>Retry</button>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.desktopLayout}>
          <div className={styles.desktopOverlay} onClick={handleClose} />
          <div className={styles.desktopModal}>
            <div className={styles.modalHeader}>
              <h2>New Transaction</h2>
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">&times;</button>
            </div>
            <div className="error-state">
              <div className="error-state-icon">{'\u26A0\uFE0F'}</div>
              <p className="error-state-text">{acctError}</p>
              <button className="retry-btn" onClick={() => { fetchAccounts(); fetchMembers(); }}>Retry</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <div className={styles.mobileLayout}>
          <div className={styles.wizard}>
            <div className={styles.sheet}>
              <div className={styles.handle} />
              <div className={styles.header}>
                <h2>New Transaction</h2>
                <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">&times;</button>
              </div>
              <div className={styles.loadingBody}>
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-row" />
                <div className="skeleton skeleton-row" />
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-row" />
              </div>
            </div>
          </div>
        </div>
        <div className={styles.desktopLayout}>
          <div className={styles.desktopOverlay} onClick={handleClose} />
          <div className={styles.desktopModal}>
            <div className={styles.modalHeader}>
              <h2>New Transaction</h2>
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">&times;</button>
            </div>
            <div className={styles.loadingBody}>
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-row" />
              <div className="skeleton skeleton-row" />
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-row" />
            </div>
            <div className={styles.modalActions}>
              <div className="skeleton skeleton-wizard" />
              <div className="skeleton skeleton-wizard" />
            </div>
          </div>
        </div>
      </>
    );
  }

  const buttonLabel =
    tab === 'income' ? 'Complete Income' :
    tab === 'expense' ? 'Complete Expense' :
    tab === 'loan' ? 'Issue Loan' :
    'Complete Transfer';

  const formFields = (
    <>
      <div className={`${styles.amountRow} ${errors.amount ? styles.fieldError : ''}`}>
        <span className={styles.amountCurrency}>{currency}</span>
        <input
          className={styles.amountInput}
          type="text"
          inputMode="decimal"
          placeholder="0"
          value={displayAmount}
          onChange={handleAmountChange}
        />
      </div>
      {errors.amount && <span className={styles.errorText}>{errors.amount}</span>}

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Date</span>
        <DatePicker value={date} onChange={setDate} />
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Source Account</span>
        <Select value={source} onValueChange={(v) => { if (v !== null) { setSource(v); clearError('source'); } }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select account">
              {source ? accountOptionLabel(source) : null}
            </SelectValue>
          </SelectTrigger>
            <SelectContent className="min-w-[360px]">
              {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                <span className="flex items-center gap-3 w-full min-w-0">
                  <span className="flex flex-col min-w-0 flex-1">
                    <span className="text-[11px] text-muted-foreground tracking-wide truncate">
                      {memberLookup[a.memberId]?.name ?? '?'}
                    </span>
                    <span className="text-sm font-medium truncate">
                      {a.name}
                    </span>
                  </span>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums shrink-0">
                    {formatAmount(a.balance, locale, currency)}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.source && <span className={styles.errorText}>{errors.source}</span>}
      </div>

      {tab === 'transfer' && (
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Destination Account</span>
          <Select value={destination} onValueChange={(v) => { if (v !== null) { setDestination(v); clearError('destination'); } }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select account">
                {destination ? accountOptionLabel(destination) : null}
              </SelectValue>
            </SelectTrigger>
          <SelectContent className="min-w-[360px]">
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  <span className="flex items-center gap-3 w-full min-w-0">
                    <span className="flex flex-col min-w-0 flex-1">
                      <span className="text-[11px] text-muted-foreground tracking-wide truncate">
                        {memberLookup[a.memberId]?.name ?? '?'}
                      </span>
                      <span className="text-sm font-medium truncate">
                        {a.name}
                      </span>
                    </span>
                    <span className="font-mono text-xs text-muted-foreground tabular-nums shrink-0">
                      {formatAmount(a.balance, locale, currency)}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.destination && <span className={styles.errorText}>{errors.destination}</span>}
        </div>
      )}

      {tab === 'loan' && (
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Debtor</span>
          <Select value={debtor} onValueChange={(v) => { if (v !== null) { setDebtor(v); clearError('debtor'); } }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select debtor">
                {debtor ? debtorOptions.find(d => d.value === debtor)?.label : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="min-w-[240px]">
              {debtorOptions.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium">{m.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.debtor && <span className={styles.errorText}>{errors.debtor}</span>}
        </div>
      )}

      <FormTextarea
        label="Description"
        placeholder="What's this for?"
        value={description}
        maxLength={200}
        onChange={(e) => { setDescription(e.target.value); clearError('description'); }}
      />
      {errors.description && <span className={styles.errorText}>{errors.description}</span>}

      {txError && <span className={styles.errorText}>{txError}</span>}
    </>
  );

  return (
    <>
      <div className={`${styles.mobileLayout} ${closing ? styles.closing : ''}`}>
        <div className={styles.wizard}>
          <div className={styles.sheet}>
            <div className={styles.handle} />
            <div className={styles.header}>
              <h2>New Transaction</h2>
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">&times;</button>
            </div>

            <div className={styles.filterTabs}>
              <SegmentedTabs tabs={tabs} activeKey={tab} onChange={setTab} />
            </div>

            <div className={styles.formBody}>
              {formFields}
              <button className={styles.submitBtn} onClick={handleSubmit} disabled={!rawAmount || Object.keys(errors).length > 0}>
                {buttonLabel}
              </button>
            </div>

            <div className={styles.numpadArea}>
              <Numpad onInput={handleNumpadInput} onBackspace={handleNumpadBackspace} />
            </div>
          </div>
        </div>
      </div>

      <div className={`${styles.desktopLayout} ${closing ? styles.closing : ''}`}>
        <div className={styles.desktopOverlay} onClick={handleClose} />
        <div className={styles.desktopModal}>
          <div className={styles.modalHeader}>
            <h2>New Transaction</h2>
            <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">&times;</button>
          </div>
          <div className={styles.modalBody}>
            <SegmentedTabs tabs={tabs} activeKey={tab} onChange={setTab} />
            {formFields}
          </div>
          <div className={styles.modalActions}>
            <button className={styles.cancelBtn} onClick={handleClose}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleSubmit} disabled={!rawAmount || Object.keys(errors).length > 0}>{buttonLabel}</button>
          </div>
        </div>
      </div>
    </>
  );
}
