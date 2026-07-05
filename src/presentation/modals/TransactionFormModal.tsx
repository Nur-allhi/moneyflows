import { useState, useEffect, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DatePicker } from '../../components/ui/date-picker';
import { SegmentedTabs, FormTextarea, Numpad } from '../components';
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

type ValidationErrors = Record<string, string>;

function validateForm(
  tab: string,
  rawAmount: string,
  description: string,
  source: string,
  destination: string,
  accounts: Account[],
  locale: string,
  currency: string,
  loanAction: string,
  selectedBorrowerId: string,
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
    if (loanAction === 'lend') {
      if (!source) next.source = 'Select a lender account';
      if (!destination) next.destination = 'Select a borrower account';
    } else {
      if (!selectedBorrowerId) next.source = 'Select a counterparty to repay';
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
      if (srcAcct && amountNum > srcAcct.balance) {
        next.amount = `Insufficient balance (${formatAmount(srcAcct.balance, locale, currency)} available)`;
      }
    }
  }

  return next;
}

export function TransactionFormModal({
  onClose,
  initialSource,
  initialDestination,
  initialTab,
  initialBorrowerId,
}: TransactionFormModalProps) {
  const { accounts, loading: acctLoading, error: acctError, fetchAccounts } = useAccountStore();
  const { members, loading: memberLoading, fetchMembers } = useMemberStore();
  const { addTransaction, error: txError } = useTransactionStore();
  const { loanStacks, createLoan, recordRepayment, createCounterparty, fetchLoanStacks } = useLoanStore();
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
  const [showBorrowerPicker, setShowBorrowerPicker] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchMembers();
    fetchLoanStacks();
  }, []);

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

  const repayStackOptions = useMemo(() => {
    return loanStacks
      .filter((s) => s.totalOutstanding > 0)
      .map((s) => ({
        borrowerId: s.debtorId,
        label: `${s.debtorName} - ${formatAmount(s.totalOutstanding, locale, currency)}`,
      }));
  }, [loanStacks, locale, currency]);

  const validate = useCallback((): boolean => {
    const next = validateForm(tab, rawAmount, description, source, destination, accounts, locale, currency, loanAction, selectedBorrowerId);
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [tab, rawAmount, description, source, destination, accounts, locale, currency, loanAction, selectedBorrowerId]);

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

  const handleCreateCp = async () => {
    if (!newCpName.trim()) return;
    try {
      const result = await createCounterparty(newCpName.trim());
      setDestination(result.accountId);
      setShowAddCp(false);
      setNewCpName('');
    } catch { }
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

    if (tab === 'loan') {
      setClosing(true);
      try {
        if (loanAction === 'lend') {
          await createLoan({
            lenderAccountId: source,
            borrowerAccountId: destination,
            amount,
            description: description.trim(),
            date,
            memberId: txMemberId,
          });
        } else {
          await recordRepayment({
            borrowerAccountId: selectedBorrowerId,
            amount,
            description: description.trim(),
            date,
            memberId: txMemberId,
            destinationAccountId: destination,
          });
        }
        await fetchAccounts();
        await fetchLoanStacks();
      } catch (e) {
        setErrors({ amount: (e as Error).message });
        return;
      }
      setTimeout(() => onClose(), 300);
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
    tab === 'transfer' ? 'Complete Transfer' :
    loanAction === 'lend' ? 'Confirm Loan' : 'Confirm Repayment';

  const formFields = (
    <>
      {tab === 'loan' && (
        <div className={styles.loanTypeStrip}>
          <button
            className={`${styles.loanTypeBtn} ${loanAction === 'lend' ? styles.loanTypeActive : ''}`}
            onClick={() => setLoanAction('lend')}
          >Lend Money</button>
          <button
            className={`${styles.loanTypeBtn} ${loanAction === 'repay' ? styles.loanTypeActive : ''}`}
            onClick={() => setLoanAction('repay')}
          >Record Repayment</button>
        </div>
      )}

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

      {tab === 'loan' && loanAction === 'repay' ? (
        <>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Counterparty</span>
            <button
              type="button"
              className={styles.pickerTrigger}
              onClick={() => setShowBorrowerPicker(true)}
            >
              {selectedBorrowerId
                ? <><span className={styles.pickerValue}>{repayStackOptions.find(o => o.borrowerId === selectedBorrowerId)?.label ?? 'Select counterparty'}</span><span className={styles.pickerArrow}>{'\u25BE'}</span></>
                : <span className={styles.pickerPlaceholder}>Select counterparty</span>}
            </button>
          </div>
          <div className={`${styles.slideField} ${styles.slideOpen}`}>
            <div className={styles.slideInner}>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Paid To</span>
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
        </>
      ) : (
        <>
          <div className={`${styles.slideField} ${styles.slideOpen}`}>
            <div className={styles.slideInner}>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>
                  {tab === 'loan' && loanAction === 'lend' ? 'Lender Account' : 'Source Account'}
                </span>
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

          <div className={`${styles.slideField} ${tab === 'loan' || tab === 'transfer' ? styles.slideOpen : ''}`}>
            <div className={styles.slideInner}>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>
                  {tab === 'loan' && loanAction === 'lend' ? 'Borrower Account' : 'Destination Account'}
                </span>
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
        </>
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

      {showBorrowerPicker && (
        <div className={styles.pickerOverlay} onClick={() => setShowBorrowerPicker(false)}>
          <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.pickerHeader}>
              <span className={styles.pickerTitle}>Select Counterparty</span>
              <button className={styles.pickerClose} onClick={() => setShowBorrowerPicker(false)}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className={styles.pickerBody}>
              {repayStackOptions.length === 0 ? (
                <div className={styles.pickerEmpty}>No counterparties with outstanding loans</div>
              ) : (
                <div className={styles.pickerList}>
                  {repayStackOptions.map((opt) => (
                    <button
                      key={opt.borrowerId}
                      className={`${styles.pickerItem} ${selectedBorrowerId === opt.borrowerId ? styles.pickerItemActive : ''}`}
                      onClick={() => {
                        setSelectedBorrowerId(opt.borrowerId);
                        setShowBorrowerPicker(false);
                      }}
                    >
                      <span className={styles.pickerItemName}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {pickerField && (
        <div className={styles.pickerOverlay} onClick={() => { setPickerField(null); setPickerMember(null); }}>
          <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.pickerHeader}>
              <button className={styles.pickerBack} onClick={() => setPickerMember(null)} style={{ visibility: !pickerMember ? 'hidden' : 'visible' }}>{'\u25C0'}</button>
              <span className={styles.pickerTitle}>
                {pickerMember ? 'Select Account' : 'Select Member'}
              </span>
              <button className={styles.pickerClose} onClick={() => { setPickerField(null); setPickerMember(null); }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className={styles.pickerBody}>
              {!pickerMember ? (
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
                  {tab === 'loan' && pickerField === 'destination' && (
                    <>
                      <div className={styles.pickerItem} style={{ opacity: 0.4, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 14px', cursor: 'default' }}>
                        Person
                      </div>
                      {counterpartyAccounts.length === 0 ? (
                        <div className={styles.pickerEmpty}>No persons yet</div>
                      ) : (
                        counterpartyAccounts.map((a) => (
                          <button
                            key={a.id}
                            className={styles.pickerItem}
                            onClick={() => {
                              setDestination(a.id);
                              clearError('destination');
                              setPickerField(null);
                              setPickerMember(null);
                            }}
                          >
                            <span className={styles.pickerItemName}>{a.name}</span>
                            <span className={styles.pickerItemMeta}>Counterparty</span>
                            <span className={styles.pickerItemBalance}>{formatAmount(a.balance, locale, currency)}</span>
                          </button>
                        ))
                      )}
                      <button
                        className={styles.pickerCreateBtn}
                        onClick={() => {
                          setShowAddCp(true);
                          setPickerField(null);
                          setPickerMember(null);
                        }}
                      >
                        + Create New Person
                      </button>
                    </>
                  )}
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

      {showAddCp && (
        <div className={styles.pickerOverlay} onClick={() => setShowAddCp(false)}>
          <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.pickerHeader}>
              <span className={styles.pickerTitle}>Create New Person</span>
              <button className={styles.pickerClose} onClick={() => setShowAddCp(false)}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className={styles.pickerBody}>
              <div className={styles.createCpBody}>
                <input
                  className={styles.inputField}
                  placeholder="Person name"
                  value={newCpName}
                  onChange={(e) => setNewCpName(e.target.value)}
                  autoFocus
                />
                <div className={styles.createCpActions}>
                  <button className={styles.cancelBtn} onClick={() => { setShowAddCp(false); setNewCpName(''); }}>Cancel</button>
                  <button className={styles.saveBtn} onClick={handleCreateCp}>Create</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
