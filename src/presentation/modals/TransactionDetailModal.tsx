import { Modal } from '../components';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useMemberStore } from '../stores/useMemberStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useModalStore } from '../stores/useModalStore';
import { formatAmount } from '../utils/format';
import { TX_TYPE_ICON } from '../constants/labels';
import styles from './TransactionDetailModal.module.css';

interface TransactionDetailModalProps {
  txId: string;
  onClose: () => void;
}

export function TransactionDetailModal({ txId, onClose }: TransactionDetailModalProps) {
  const transaction = useTransactionStore((s) => s.transactions.find((t) => t.id === txId));
  const members = useMemberStore((s) => s.members);
  const accounts = useAccountStore((s) => s.accounts);
  const { locale, currency } = useSettingsStore((s) => s.settings);

  if (!transaction) return null;

  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const memberLookup = new Map(members.map((m) => [m.id, m]));
  const memberMap = new Map(members.filter((m) => m.isExternal).map((m) => [m.id, m]));

  const handleEdit = () => {
    onClose();
    setTimeout(() => useModalStore.getState().open('transaction-edit', { txId }), 50);
  };

  const handleDelete = () => {
    onClose();
    setTimeout(() => useModalStore.getState().open('delete-confirm', { txId }), 50);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`${TX_TYPE_ICON[transaction.type] ?? ''} Transaction Details`}
      footer={
        <div className={styles.footer}>
          <button className={styles.iconBtn} onClick={handleEdit} title="Edit">
            <span className={styles.icon}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            </span>
            <span className={styles.btnLabel}>Edit</span>
          </button>
          <button className={styles.iconBtn} onClick={handleDelete} title="Delete">
            <span className={styles.icon}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </span>
            <span className={styles.btnLabel}>Delete</span>
          </button>
        </div>
      }
    >
      <div className={styles.body}>
        <div className={styles.type}>
          {transaction.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </div>
        <div className={styles.amount}>{formatAmount(transaction.amount, locale, currency)}</div>
        <div className={styles.desc}>{transaction.description}</div>
        <div className={styles.grid}>
          <div className={styles.field}>
            <span className={styles.fieldKey}>Date{transaction.date.includes('T') ? ' & Time' : ''}</span>
            <span className={styles.value}>
              {new Intl.DateTimeFormat(locale, {
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                ...(transaction.date.includes('T') ? { hour: '2-digit', minute: '2-digit' } : {}),
              }).format(new Date(transaction.date))}
            </span>
          </div>
          {transaction.sourceAccount && (() => {
            const acct = accountMap.get(transaction.sourceAccount!);
            const fromMember = acct ? memberLookup.get(acct.memberId) : null;
            return (
              <div className={styles.field}>
                <span className={styles.fieldKey}>From Account</span>
                <span className={styles.value}>
                  {acct?.name ?? 'Unknown'}
                  {fromMember && <span className={styles.member}>– {fromMember.name}</span>}
                </span>
              </div>
            );
          })()}
          {transaction.destAccount && (() => {
            const acct = accountMap.get(transaction.destAccount!);
            const toMember = acct ? memberLookup.get(acct.memberId) : null;
            return (
              <div className={styles.field}>
                <span className={styles.fieldKey}>To Account</span>
                <span className={styles.value}>
                  {acct?.name ?? 'Unknown'}
                  {toMember && <span className={styles.member}>– {toMember.name}</span>}
                </span>
              </div>
            );
          })()}
          {transaction.debtorId && (
            <div className={styles.field}>
              <span className={styles.fieldKey}>Debtor</span>
              <span className={styles.value}>
                {memberMap.get(transaction.debtorId)?.name ?? 'Unknown'}
              </span>
            </div>
          )}
          {transaction.loanRef && (
            <div className={styles.field}>
              <span className={styles.fieldKey}>Loan Reference</span>
              <span className={styles.value}>{transaction.loanRef}</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
