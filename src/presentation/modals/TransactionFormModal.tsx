import { useState, useEffect, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DatePicker } from '../../components/ui/date-picker';
import { SegmentedTabs, FormTextarea, Numpad, LoanFormSection } from '../components';
import type { LoanMode } from '../components';
import { LOAN_MODE_BUTTON_LABELS } from '../components/LoanFormSection';
import { useAccountStore } from '../stores/useAccountStore';
import { useMemberStore } from '../stores/useMemberStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useLoanStore } from '../stores/useLoanStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { formatAmount } from '../utils/format';
import { Transaction } from '../../core/domain/Transaction';
import type { Account } from '../../core/domain/Account';
import styles from './TransactionFormModal.module.css';

interface TransactionFormModalProps {
  onClose: () => void;
}

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
  counterpartyId: string,
  accounts: Account[],
  counterpartyAccounts: Account[],
  locale: string,
  currency: string,
  loanMode?: LoanMode,
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

  if (tab === 'loan') {
    if (loanMode === 'give' || loanMode === 'payback') {
      if (!source) {
        next.source = 'Select an account';
      } else {
        const acct = accounts.find((a) => a.id === source);
        if (!acct) next.source = 'Account not found';
        else if (!acct.isActive) next.source = 'Account is inactive';
      }
    }
    if (loanMode === 'give' && source && destination && source === destination) {
      next.destination = 'Source and destination must differ';
    }
    if (loanMode === 'take' || loanMode === 'repay') {
      if (!destination) {
        next.destination = 'Select a destination account';
      } else {
        const acct = accounts.find((a) => a.id === destination);
        if (!acct) next.destination = 'Account not found';
        else if (!acct.isActive) next.destination = 'Account is inactive';
      }
    }
    if (loanMode === 'repay' && source && destination && source === destination) {
      next.destination = 'Source and destination must differ';
    }
    if (loanMode === 'repay' && source) {
      const acct = accounts.find((a) => a.id === source);
      if (!acct) next.source = 'Account not found';
      else if (!acct.isActive) next.source = 'Account is inactive';
    }
    if (!counterpartyId) {
      next.debtor = 'Select a counterparty';
    } else if (!counterpartyAccounts.find((a) => a.id === counterpartyId)) {
      next.debtor = 'Counterparty not found';
    }
  } else {
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

    if (source && tab !== 'income' && !isNaN(amountNum) && amountNum > 0) {
      const srcAcct = accounts.find((a) => a.id === source);
      if (srcAcct && amountNum > srcAcct.balance && tab !== 'loan') {
        next.amount = `Insufficient balance (${formatAmount(srcAcct.balance, locale, currency)} available)`;
      }
    }
  }

  return next;
}

export function TransactionFormModal({ onClose }: TransactionFormModalProps) {
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
  const [loanMode, setLoanMode] = useState<LoanMode>('give');
  const counterpartyType: 'debtor' | 'creditor' =
    loanMode === 'take' || loanMode === 'payback' ? 'creditor' : 'debtor';
  const counterpartyLabel = counterpartyType === 'debtor' ? 'Debtor' : 'Creditor';
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [closing, setClosing] = useState(false);

  const [pickerField, setPickerField] = useState<'source' | 'destination' | 'counterparty' | null>(null);
  const [pickerMember, setPickerMember] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
    fetchMembers();
  }, []);

  useEffect(() => {
    if (tab !== 'loan') return;
    if (loanMode === 'take' || loanMode === 'repay') {
      setSource('');
    }
    if (loanMode === 'give' || loanMode === 'payback') {
      setDestination('');
    }
    setDebtor('');
  }, [loanMode, tab]);

  const counterpartyAccounts = useMemo(
    () => accounts.filter((a) => a.type === 'counterparty'),
    [accounts],
  );

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

  const accountLabel = useCallback((id: string) => {
    const a = accounts.find(a => a.id === id);
    if (!a) return '';
    if (!a.memberId) return a.name;
    const memberName = memberLookup[a.memberId]?.name ?? '';
    return memberName ? `${a.name} \u2014 ${memberName}` : a.name;
  }, [accounts, memberLookup]);

  const displayAmount = rawAmount ? Intl.NumberFormat(locale).format(parseInt(rawAmount, 10)) : '';

  const validate = useCallback((): boolean => {
    const next = validateForm(tab, rawAmount, description, source, destination, debtor, accounts, counterpartyAccounts, locale, currency, loanMode);
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [tab, rawAmount, description, source, destination, debtor, accounts, counterpartyAccounts, locale, currency, loanMode]);

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
    setTimeout(() => onClose(), 300);
  };

  const { createGivenLoan, createReceivedLoan, recordRepayment, recordPayback } = useLoanStore();

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

    if (tab === 'loan') {
      const capitalizedDesc = description.trim().charAt(0).toUpperCase() + description.trim().slice(1);
      try {
        switch (loanMode) {
          case 'give':
            await createGivenLoan({
              sourceAccount: source, destAccount: debtor,
              amount, description: capitalizedDesc, date, memberId: txMemberId,
            });
            break;
          case 'take':
            await createReceivedLoan({
              sourceAccount: debtor, destAccount: destination,
              amount, description: capitalizedDesc, date, memberId: txMemberId,
            });
            break;
          case 'repay':
            await recordRepayment({
              sourceAccount: debtor, destAccount: destination,
              amount, loanRef: '', description: capitalizedDesc, date, memberId: txMemberId,
            });
            break;
          case 'payback':
            await recordPayback({
              sourceAccount: source, destAccount: debtor,
              amount, loanRef: '', description: capitalizedDesc, date, memberId: txMemberId,
            });
            break;
        }
      } catch {
        return;
      }
      await fetchAccounts();
      onClose();
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
      default:
        return;
    }

    const now = new Date();
    const [y, m, d] = date.split('-');
    const dateTime = new Date(Number(y), Number(m) - 1, Number(d), now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();

    const cleanDesc = description.trim();
    const capitalizedDesc = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);

    const tx = new Transaction(
      uuidv4(), type, capitalizedDesc, amount, txMemberId, dateTime, src, dst, debtorId,
    );

    await addTransaction(tx);
    await fetchAccounts();
    onClose();
  };

  const loading = acctLoading || memberLoading;
  const emptyAccounts = !loading && !acctError && accounts.length === 0;

  if (emptyAccounts) {
    return (
      <>
        <div className={styles.mobileLayout}>
          <div className={styles.wizard} onClick={handleClose}>
            <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
              <div className={styles.handle} />
              <div className={styles.header}>
                <h2>New Transaction</h2>
                <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">&times;</button>
              </div>
              <div className="empty-state">
                <div className="empty-state-icon">{'\u{1F4B0}'}</div>
                <p className="empty-state-text">No accounts available</p>
                <button className="retry-btn" onClick={handleClose}>Go Back</button>
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
              <button className="retry-btn" onClick={handleClose}>Go Back</button>
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
          <div className={styles.wizard} onClick={handleClose}>
            <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
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
          <div className={styles.wizard} onClick={handleClose}>
            <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
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
    tab === 'loan' ? LOAN_MODE_BUTTON_LABELS[loanMode] :
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
        <DatePicker className={styles.inputField} value={date} onChange={setDate} />
      </div>

      <div className={`${styles.slideField} ${tab === 'loan' && (loanMode === 'give' || loanMode === 'payback') ? styles.slideOpen : tab !== 'loan' ? styles.slideOpen : ''}`}>
        <div className={styles.slideInner}>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Source Account</span>
            <button
              type="button"
              className={`${styles.pickerTrigger} ${errors.source ? styles.fieldError : ''}`}
              onClick={() => { setPickerField('source'); setPickerMember(null); }}
            >
              {source
                ? <><span className={styles.pickerValue}>{accountLabel(source)}</span><span className={styles.pickerArrow}>{'\u25BE'}</span></>
                : <span className={styles.pickerPlaceholder}>Select account</span>}
            </button>
            {errors.source && <span className={styles.errorText}>{errors.source}</span>}
          </div>
        </div>
      </div>

      <div className={`${styles.slideField} ${tab === 'transfer' ? styles.slideOpen : tab === 'loan' && (loanMode === 'take' || loanMode === 'repay') ? styles.slideOpen : ''}`}>
        <div className={styles.slideInner}>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Destination Account</span>
            <button
              type="button"
              className={`${styles.pickerTrigger} ${errors.destination ? styles.fieldError : ''}`}
              onClick={() => { setPickerField('destination'); setPickerMember(null); }}
            >
              {destination
                ? <><span className={styles.pickerValue}>{accountLabel(destination)}</span><span className={styles.pickerArrow}>{'\u25BE'}</span></>
                : <span className={styles.pickerPlaceholder}>Select account</span>}
            </button>
            {errors.destination && <span className={styles.errorText}>{errors.destination}</span>}
          </div>
        </div>
      </div>

      {tab === 'loan' && (
        <LoanFormSection
          mode={loanMode}
          onModeChange={setLoanMode}
          counterpartyId={debtor}
          onCounterpartyChange={(id) => { setDebtor(id); clearError('debtor'); }}
          counterpartyAccounts={counterpartyAccounts}
          onAddCounterparty={async (name, type) => {
            const result = await useLoanStore.getState().createCounterparty(name, type);
            await fetchAccounts();
            return result.accountId;
          }}
          onOpenPicker={() => { setPickerField('counterparty'); setPickerMember(null); }}
          error={errors.debtor}
          onClearError={() => clearError('debtor')}
        />
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
        <div className={styles.wizard} onClick={handleClose}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.handle} />
            <div className={styles.header}>
              <h2>New Transaction</h2>
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">&times;</button>
            </div>

            <div className={styles.filterTabs}>
              <SegmentedTabs tabs={tabs} activeKey={tab} onChange={setTab} />
            </div>

            <div className={styles.formBody} onKeyDown={(e) => { if (e.key === 'Enter') { if (e.ctrlKey || e.metaKey) { e.preventDefault(); handleSubmit(); } else if (!(e.target instanceof HTMLTextAreaElement)) { e.preventDefault(); } } }}>
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
          <div className={styles.modalBody} onKeyDown={(e) => { if (e.key === 'Enter') { if (e.ctrlKey || e.metaKey) { e.preventDefault(); handleSubmit(); } else if (!(e.target instanceof HTMLTextAreaElement)) { e.preventDefault(); } } }}>
            <SegmentedTabs tabs={tabs} activeKey={tab} onChange={setTab} />
            {formFields}
          </div>
          <div className={styles.modalActions}>
            <button className={styles.cancelBtn} onClick={handleClose}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleSubmit} disabled={!rawAmount || Object.keys(errors).length > 0}>{buttonLabel}</button>
          </div>
        </div>
      </div>

      {pickerField && (
        <div className={styles.pickerOverlay} onClick={() => { setPickerField(null); setPickerMember(null); }}>
          <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.pickerHeader}>
              <button className={styles.pickerBack} onClick={() => setPickerMember(null)} style={{ visibility: pickerField === 'counterparty' || !pickerMember ? 'hidden' : 'visible' }}>{'\u25C0'}</button>
              <span className={styles.pickerTitle}>
                {pickerField === 'counterparty' ? `Select ${counterpartyLabel}` : pickerMember ? 'Select Account' : 'Select Member'}
              </span>
              <button className={styles.pickerClose} onClick={() => { setPickerField(null); setPickerMember(null); }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className={styles.pickerBody}>
              {pickerField === 'counterparty' ? (
                <div className={styles.pickerList}>
                  {counterpartyAccounts.filter((a) => (a.metadata?.counterpartyType as string) === counterpartyType).length === 0 ? (
                    <div className={styles.pickerEmpty}>No {counterpartyLabel.toLowerCase()} accounts. Use + to add one.</div>
                  ) : (
                    counterpartyAccounts.filter((a) => (a.metadata?.counterpartyType as string) === counterpartyType).map((a) => (
                      <button
                        key={a.id}
                        className={styles.pickerItem}
                        onClick={() => {
                          setDebtor(a.id);
                          clearError('debtor');
                          setPickerField(null);
                          setPickerMember(null);
                        }}
                      >
                        <span className={styles.pickerItemName}>{a.name}</span>
                        <span className={styles.pickerItemMeta}>{counterpartyLabel}</span>
                      </button>
                    ))
                  )}
                </div>
              ) : !pickerMember ? (
                <div className={styles.pickerList}>
                  {internalMembers.map((m) => (
                    <button
                      key={m.id}
                      className={styles.pickerItem}
                      onClick={() => setPickerMember(m.id)}
                    >
                      <span className={styles.pickerItemName}>{m.name}</span>
                      {m.shortName && <span className={styles.pickerItemMeta}>{m.shortName}</span>}
                      <span className={styles.pickerItemCount}>{accountsByMember[m.id]?.length ?? 0} accounts</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.pickerList}>
                  {(accountsByMember[pickerMember] ?? []).length === 0 ? (
                    <div className={styles.pickerEmpty}>No accounts for this member</div>
                  ) : (
                    (accountsByMember[pickerMember] ?? []).map((a) => (
                      <button
                        key={a.id}
                        className={styles.pickerItem}
                        onClick={() => {
                          if (pickerField === 'source') setSource(a.id);
                          else setDestination(a.id);
                          clearError(pickerField);
                          setPickerField(null);
                          setPickerMember(null);
                        }}
                      >
                        <span className={styles.pickerItemName}>{a.name}</span>
                        <span className={styles.pickerItemMeta}>{a.type.replace('_', ' ')}</span>
                        <span className={styles.pickerItemBalance}>{formatAmount(a.balance, locale, currency)}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
