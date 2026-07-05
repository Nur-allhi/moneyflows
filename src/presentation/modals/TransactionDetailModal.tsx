import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Transaction } from '../../core/domain/Transaction';
import { Modal, BottomSheet } from '../components';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useMemberStore } from '../stores/useMemberStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useModalStore } from '../stores/useModalStore';
import { formatAmount } from '../utils/format';
import { TX_TYPE_ICON, displayTxType } from '../constants/labels';
import styles from './TransactionDetailModal.module.css';

interface TransactionDetailModalProps {
  txId?: string;
  transaction?: Transaction;
  onClose: () => void;
}

export function TransactionDetailModal({ txId, transaction: txProp, onClose }: TransactionDetailModalProps) {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const storeTx = useTransactionStore((s) => txId ? s.transactions.find((t) => t.id === txId) : undefined);
  const loading = useTransactionStore((s) => s.loading);
  const members = useMemberStore((s) => s.members);
  const accounts = useAccountStore((s) => s.accounts);
  const { locale, currency } = useSettingsStore((s) => s.settings);

  const transaction = txProp ?? storeTx;

  if (!transaction) {
    return (
      <Modal isOpen onClose={onClose} title="Transaction Details">
        <div className={styles.body}>
          <p className={styles.empty}>{loading ? 'Loading...' : 'Transaction not found.'}</p>
        </div>
      </Modal>
    );
  }

  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const memberLookup = new Map(members.map((m) => [m.id, m]));

  const handleEdit = () => {
    onClose();
    setTimeout(() => useModalStore.getState().open('transaction-edit', { txId: transaction.id }), 50);
  };

  const handleDelete = () => {
    onClose();
    setTimeout(() => useModalStore.getState().open('delete-confirm', { txId: transaction.id }), 50);
  };

  const handleOpenLedger = () => {
    if (!transaction) return;
    const srcAcct = transaction.sourceAccount ? accountMap.get(transaction.sourceAccount) : null;
    const dstAcct = transaction.destAccount ? accountMap.get(transaction.destAccount) : null;
    const ledgerAcct = (srcAcct && srcAcct.type !== 'counterparty') ? srcAcct
      : (dstAcct && dstAcct.type !== 'counterparty') ? dstAcct
      : null;
    if (!ledgerAcct || !ledgerAcct.memberId) return;
    onClose();
    navigate(`/member/${ledgerAcct.memberId}?account=${ledgerAcct.id}`);
  };

  const detailContent = (
    <div className={styles.body}>
      <div className={styles.type}>
        {displayTxType(transaction.type)}
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
          const fromMember = acct && acct.memberId ? memberLookup.get(acct.memberId) : null;
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
          const toMember = acct && acct.memberId ? memberLookup.get(acct.memberId) : null;
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
        {transaction.type === 'lend' && transaction.sourceAccount && transaction.destAccount && (() => {
          const lenderAcct = accountMap.get(transaction.sourceAccount!);
          const borrowerAcct = accountMap.get(transaction.destAccount!);
          const lenderMember = lenderAcct?.memberId ? memberLookup.get(lenderAcct.memberId) : null;
          const borrowerMember = borrowerAcct?.memberId ? memberLookup.get(borrowerAcct.memberId) : null;
          return (<>
            <div className={styles.field}>
              <span className={styles.fieldKey}>Lender</span>
              <span className={styles.value}>{lenderAcct?.name ?? 'Unknown'}{lenderMember ? ` \u2014 ${lenderMember.name}` : ''}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldKey}>Borrower</span>
              <span className={styles.value}>{borrowerAcct?.name ?? 'Unknown'}{borrowerMember ? ` \u2014 ${borrowerMember.name}` : ''}</span>
            </div>
          </>);
        })()}
        {transaction.type === 'repay' && transaction.sourceAccount && transaction.destAccount && (() => {
          const payerAcct = accountMap.get(transaction.sourceAccount!);
          const recipientAcct = accountMap.get(transaction.destAccount!);
          const payerMember = payerAcct?.memberId ? memberLookup.get(payerAcct.memberId) : null;
          const recipientMember = recipientAcct?.memberId ? memberLookup.get(recipientAcct.memberId) : null;
          return (<>
            <div className={styles.field}>
              <span className={styles.fieldKey}>Payer</span>
              <span className={styles.value}>{payerAcct?.name ?? 'Unknown'}{payerMember ? ` \u2014 ${payerMember.name}` : ''}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldKey}>Recipient</span>
              <span className={styles.value}>{recipientAcct?.name ?? 'Unknown'}{recipientMember ? ` \u2014 ${recipientMember.name}` : ''}</span>
            </div>
          </>);
        })()}
        {transaction.type !== 'lend' && transaction.type !== 'repay' && (() => {
          const srcAcct = transaction.sourceAccount ? accountMap.get(transaction.sourceAccount) : null;
          const dstAcct = transaction.destAccount ? accountMap.get(transaction.destAccount) : null;
          const cpAcct = srcAcct?.type === 'counterparty' ? srcAcct : dstAcct?.type === 'counterparty' ? dstAcct : null;
          if (cpAcct) {
            const cpType = (cpAcct.metadata?.counterpartyType as string) ?? 'debtor';
            return (
              <div className={styles.field}>
                <span className={styles.fieldKey}>{cpType === 'creditor' ? 'Creditor' : 'Debtor'}</span>
                <span className={styles.value}>{cpAcct.name}</span>
              </div>
            );
          }
          if (transaction.type === 'loan_issue' || transaction.type === 'loan_repayment') {
            if (transaction.debtorId) {
              const debtorMember = memberLookup.get(transaction.debtorId);
              if (debtorMember) {
                return (
                  <div className={styles.field}>
                    <span className={styles.fieldKey}>Borrower</span>
                    <span className={styles.value}>{debtorMember.name}</span>
                  </div>
                );
              }
            }
            const borrowerId = transaction.type === 'loan_issue' ? transaction.destAccount : transaction.sourceAccount;
            const borrowerAcct = borrowerId ? accountMap.get(borrowerId) : null;
            if (borrowerAcct) {
              const owner = borrowerAcct.memberId ? memberLookup.get(borrowerAcct.memberId) : null;
              return (
                <div className={styles.field}>
                  <span className={styles.fieldKey}>Borrower</span>
                  <span className={styles.value}>{borrowerAcct.name}{owner ? ` \u2014 ${owner.name}` : ''}</span>
                </div>
              );
            }
          }
          return null;
        })()}
        {transaction.loanRef && (
          <div className={styles.field}>
            <span className={styles.fieldKey}>Loan Reference</span>
            <span className={styles.value}>{transaction.loanRef}</span>
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet isOpen onClose={onClose} title={`${TX_TYPE_ICON[transaction.type] ?? ''} Transaction Details`}>
        {detailContent}
        <div className={styles.mobSheetFooter}>
          <button className={styles.mobSheetBtn} onClick={handleOpenLedger}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            Ledger
          </button>
          <button className={styles.mobSheetBtn} onClick={handleEdit}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            Edit
          </button>
          <button className={`${styles.mobSheetBtn} ${styles.mobSheetDanger}`} onClick={handleDelete}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            Delete
          </button>
        </div>
      </BottomSheet>
    );
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`${TX_TYPE_ICON[transaction.type] ?? ''} Transaction Details`}
      footer={
        <div className={styles.footer}>
          <button className={styles.ledgerBtn} onClick={handleOpenLedger} title="Open in Ledger">
            <span className={styles.icon}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </span>
            <span className={styles.btnLabel}>Open in Ledger</span>
          </button>
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
      {detailContent}
    </Modal>
  );
}
