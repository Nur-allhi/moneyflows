import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SegmentedTabs, FormSelect, FormTextarea, Numpad } from '../components';
import styles from './TransactionWizard.module.css';

const tabs = [
  { key: 'income', label: 'Income' },
  { key: 'expense', label: 'Expense' },
  { key: 'transfer', label: 'Transfer' },
  { key: 'loan', label: 'Loan' },
];

const accounts = [
  { value: 'brac', label: 'Brac Bank \u2014 Savings (1,12,400 BDT)' },
  { value: 'bkash', label: 'bKash \u2014 Wallet (24,670 BDT)' },
  { value: 'cash', label: 'Business Cash \u2014 Current (52,130 BDT)' },
];

function formatAmount(raw: string): string {
  const num = parseInt(raw, 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('en-IN');
}

export function TransactionWizard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('transfer');
  const [rawAmount, setRawAmount] = useState('5000');
  const [note, setNote] = useState('');
  const [source, setSource] = useState('brac');
  const [destination, setDestination] = useState('cash');

  const displayAmount = formatAmount(rawAmount);

  const handleNumpadInput = useCallback((digit: string) => {
    setRawAmount((prev) => {
      const next = prev + digit;
      return next.length > 10 ? prev : next;
    });
  }, []);

  const handleNumpadBackspace = useCallback(() => {
    setRawAmount((prev) => prev.slice(0, -1) || '0');
  }, []);

  const handleClose = () => {
    navigate(-1);
  };

  const handleSubmit = () => {
    console.log({ tab, amount: rawAmount, source, destination, note });
  };

  const buttonLabel =
    tab === 'income' ? 'Complete Income' :
    tab === 'expense' ? 'Complete Expense' :
    tab === 'loan' ? 'Issue Loan' :
    'Complete Transfer';

  return (
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
          <div className={styles.amountRow}>
            <span className={styles.amountCurrency}>BDT</span>
            <input
              className={styles.amountInput}
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={displayAmount}
              readOnly
            />
          </div>

          <FormSelect label="Source Account" value={source} onChange={(e) => setSource(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </FormSelect>

          {tab === 'transfer' && (
            <FormSelect label="Destination Account" value={destination} onChange={(e) => setDestination(e.target.value)}>
              {accounts.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </FormSelect>
          )}

          {tab === 'loan' && (
            <FormSelect label="Debtor" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="btc">BTC (3,55,000 BDT outstanding)</option>
              <option value="azam">Azam (1,20,000 BDT outstanding)</option>
            </FormSelect>
          )}

          <FormTextarea
            label="Note (optional)"
            placeholder="What's this for?"
            className={styles.noteInput}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <button className={styles.submitBtn} onClick={handleSubmit}>
            {buttonLabel}
          </button>
        </div>

        <div className={styles.numpadArea}>
          <Numpad onInput={handleNumpadInput} onBackspace={handleNumpadBackspace} />
        </div>
      </div>
    </div>
  );
}
