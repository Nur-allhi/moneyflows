import { DatePicker } from '../../../components/ui/date-picker';
import { FormTextarea } from '../../components';
import styles from '../TransactionFormModal.module.css';

interface Props {
  tab: string;
  loanAction: string;
  setLoanAction: (v: 'lend' | 'repay') => void;
  rawAmount: string;
  displayAmount: string;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAmountKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  currency: string;
  errors: Record<string, string>;
  date: string;
  setDate: (v: string) => void;
  source: string;
  destination: string;
  setPickerField: (v: 'source' | 'destination' | null) => void;
  setPickerMember: (v: string | null) => void;
  accountLabel: (id: string) => string;
  description: string;
  setDescription: (v: string) => void;
  clearError: (f: string) => void;
  tagName: string;
  setShowTagPicker: (v: boolean) => void;
  insufficientWarning: { available: number; deficit: number } | null;
  locale: string;
  formatAmount: (n: number, l: string, c: string) => string;
}

export function FormFields(props: Props & {
  insufficientWarning: { available: number; deficit: number } | null;
  handleClose: () => void;
  formatAmount: (n: number, l: string, c: string) => string;
  locale: string;
  setShowBorrowerPicker: (v: boolean) => void;
  selectedBorrowerId: string;
  repayStackOptions: { borrowerId: string; label: string }[];
  txError: string | null;
}) {
  const { tab, loanAction, setLoanAction, displayAmount, onAmountChange, onAmountKeyDown, currency, errors, date, setDate, source, destination, setPickerField, setPickerMember, accountLabel, description, setDescription, clearError, tagName, setShowTagPicker, insufficientWarning, handleClose, formatAmount, locale, setShowBorrowerPicker, selectedBorrowerId, repayStackOptions, txError } = props as Props & { insufficientWarning: { available: number; deficit: number } | null; handleClose: () => void; formatAmount: (n: number, l: string, c: string) => string; locale: string; setShowBorrowerPicker: (v: boolean) => void; selectedBorrowerId: string; repayStackOptions: { borrowerId: string; label: string }[]; txError: string | null };
  return (
    <>
      {tab === 'loan' && (
        <div className={styles.loanTypeStrip}>
          <button className={`${styles.loanTypeBtn} ${loanAction === 'lend' ? styles.loanTypeActive : ''}`} onClick={() => setLoanAction('lend')}>Lend Money</button>
          <button className={`${styles.loanTypeBtn} ${loanAction === 'repay' ? styles.loanTypeActive : ''}`} onClick={() => setLoanAction('repay')}>Record Repayment</button>
        </div>
      )}
      <div className={`${styles.amountRow} ${errors.amount ? styles.fieldError : ''}`}>
        <span className={styles.amountCurrency}>{currency}</span>
        <input className={styles.amountInput} type="text" inputMode="decimal" enterKeyHint="next" placeholder="0" value={displayAmount} onChange={onAmountChange} onKeyDown={onAmountKeyDown} />
      </div>
      {errors.amount && <span className={styles.errorText}>{errors.amount}</span>}
      {insufficientWarning && (
        <div className={styles.insufficientWarning}>
          <span className={styles.warningIcon}>{'\u26A0'}</span>
          <div className={styles.warningBody}>
            <span className={styles.warningTitle}>Low balance</span>
            <span className={styles.warningText}>Only {formatAmount(insufficientWarning.available, locale, currency)} available. Account will go negative by {formatAmount(insufficientWarning.deficit, locale, currency)} if you proceed.</span>
            <button className={styles.addTxBtn} onClick={handleClose}>+ Add Transaction</button>
          </div>
        </div>
      )}
      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Date</span>
        <DatePicker className={styles.inputField} value={date} onChange={setDate} />
      </div>
      {tab === 'loan' && loanAction === 'repay' ? (
        <>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Counterparty</span>
            <button type="button" className={styles.pickerTrigger} onClick={() => setShowBorrowerPicker(true)}>
              {selectedBorrowerId ? <><span className={styles.pickerValue}>{repayStackOptions.find((o) => o.borrowerId === selectedBorrowerId)?.label ?? 'Select counterparty'}</span><span className={styles.pickerArrow}>{'\u25BE'}</span></> : <span className={styles.pickerPlaceholder}>Select counterparty</span>}
            </button>
          </div>
          <div className={`${styles.slideField} ${styles.slideOpen}`}>
            <div className={styles.slideInner}>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Paid To</span>
                <button type="button" className={`${styles.pickerTrigger} ${errors.destination ? styles.fieldError : ''}`} onClick={() => { setPickerField('destination'); setPickerMember(null); }}>
                  {destination ? <><span className={styles.pickerValue}>{accountLabel(destination)}</span><span className={styles.pickerArrow}>{'\u25BE'}</span></> : <span className={styles.pickerPlaceholder}>Select account</span>}
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
                <span className={styles.fieldLabel}>{tab === 'loan' && loanAction === 'lend' ? 'Lender Account' : 'Source Account'}</span>
                <button type="button" className={`${styles.pickerTrigger} ${errors.source ? styles.fieldError : ''}`} onClick={() => { setPickerField('source'); setPickerMember(null); }}>
                  {source ? <><span className={styles.pickerValue}>{accountLabel(source)}</span><span className={styles.pickerArrow}>{'\u25BE'}</span></> : <span className={styles.pickerPlaceholder}>Select account</span>}
                </button>
                {errors.source && <span className={styles.errorText}>{errors.source}</span>}
              </div>
            </div>
          </div>
          <div className={`${styles.slideField} ${tab === 'loan' || tab === 'transfer' ? styles.slideOpen : ''}`}>
            <div className={styles.slideInner}>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>{tab === 'loan' && loanAction === 'lend' ? 'Borrower Account' : 'Destination Account'}</span>
                <button type="button" className={`${styles.pickerTrigger} ${errors.destination ? styles.fieldError : ''}`} onClick={() => { setPickerField('destination'); setPickerMember(null); }}>
                  {destination ? <><span className={styles.pickerValue}>{accountLabel(destination)}</span><span className={styles.pickerArrow}>{'\u25BE'}</span></> : <span className={styles.pickerPlaceholder}>Select account</span>}
                </button>
                {errors.destination && <span className={styles.errorText}>{errors.destination}</span>}
              </div>
            </div>
          </div>
        </>
      )}
      <FormTextarea label="Description" placeholder="What's this for?" value={description} maxLength={200} id="tx-description" onChange={(e) => { setDescription(e.target.value); clearError('description'); }} />
      {errors.description && <span className={styles.errorText}>{errors.description}</span>}
      {tab !== 'loan' && (
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Tag (optional)</span>
          <button type="button" className={`${styles.pickerTrigger} ${tagName ? styles.pickerHasValue : ''}`} onClick={() => setShowTagPicker(true)}>
            {tagName ? <><span className={styles.pickerValue}>{tagName}</span><span className={styles.pickerArrow}>{'\u25BE'}</span></> : <span className={styles.pickerPlaceholder}>Select tag (optional)</span>}
          </button>
        </div>
      )}
      {txError && <span className={styles.errorText}>{txError}</span>}
    </>
  );
}
