/* eslint-disable @typescript-eslint/no-explicit-any */
import { useModalStore } from '../../stores/useModalStore';
import { formatAmount, formatAmountParts } from '../../utils/format';
import { shortDate, MONTHS } from '../../constants/dates';
import { Highlight } from '../../utils/highlight';
import { ACCOUNT_TYPE_ACCENT } from '../../constants/labels';
import styles from '../Dashboard.module.css';
import { TYPE_ICON_MAP } from './icons';

export function WhereMoneyIsPanel({ filteredAccountsByMember, memberById, internalMembers, expandedMembers, closingMembers, toggleMember, memberTotalBalance, searchQuery, locale, currency }: any) {
  const MEMBER_GRADIENTS = ['linear-gradient(135deg, #6c5ce7, #a29bfe)', 'linear-gradient(135deg, #00b894, #55efc4)', 'linear-gradient(135deg, #fd79a8, #e84393)', 'linear-gradient(135deg, #0984e3, #74b9ff)', 'linear-gradient(135deg, #fdcb6e, #f39c12)', 'linear-gradient(135deg, #e17055, #d63031)'];
  if (filteredAccountsByMember.size === 0) return <div className="empty-state" style={{ padding: '24px 20px' }}><div className="empty-state-icon">{'\u{1F4B0}'}</div><p className="empty-state-text">{searchQuery ? `No accounts match "${searchQuery}"` : 'No accounts yet'}</p></div>;
  return <>{[...filteredAccountsByMember.entries()].map(([mid, accts]: any) => {
    const member = memberById[mid] ?? memberById.__unassigned__;
    const memberIdx = member ? internalMembers.indexOf(member) : -1;
    const grad = memberIdx >= 0 ? MEMBER_GRADIENTS[memberIdx % MEMBER_GRADIENTS.length] : MEMBER_GRADIENTS[0];
    const initial = member ? (member.shortName ?? member.name)[0] : '?';
    const mName = member ? member.name : 'Unassigned';
    const expanded = expandedMembers.has(mid);
    const totalBalance = memberTotalBalance.get(mid) ?? 0;
    return (
      <div key={mid} className={styles.memberGroup}>
        <div className={styles.memberHead} onClick={() => toggleMember(mid)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && toggleMember(mid)}>
          <div className={styles.miniAvatar} style={{ background: grad }}>{initial}</div>
          <span className={styles.mname}><Highlight text={mName} query={searchQuery} /></span>
          <span className={styles.memberTotal}>{formatAmountParts(totalBalance, locale, currency).amount}<span className={styles.currencyLabel}>{formatAmountParts(totalBalance, locale, currency).currency}</span></span>
          <span className={`${styles.memberChevron} ${expanded ? styles.chevronOpen : ''}`}><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4.5l3 3 3-3" /></svg></span>
        </div>
        {expanded && <div className={`${styles.memberAccounts} ${closingMembers.has(mid) ? styles.closingAccounts : ''}`}>{accts.map((acct: any) => (
          <div key={acct.id} className={styles.acctRow} onClick={(e) => { e.stopPropagation(); window.location.hash = `#/member/${mid}?account=${acct.id}`; }}>
            <span className={styles.acctTypeIcon} style={{ color: (ACCOUNT_TYPE_ACCENT as any)[acct.type] }}>{(TYPE_ICON_MAP as any)[acct.type]}</span>
            <span className={styles.acctName}><Highlight text={acct.name} query={searchQuery} /></span>
            <span className={styles.acctBalance}>{formatAmountParts(acct.balance, locale, currency).amount}<span className={styles.currencyLabel}>{formatAmountParts(acct.balance, locale, currency).currency}</span></span>
          </div>
        ))}</div>}
      </div>
    );
  })}</>;
}
export function RecentTxsPanel({ filteredRecentTxs, searchQuery, locale, currency }: any) {
  if (filteredRecentTxs.length === 0) return <div className="empty-state" style={{ padding: '24px 20px' }}><div className="empty-state-icon">{'\u{1F4CB}'}</div><p className="empty-state-text">{searchQuery ? `No matches for "${searchQuery}"` : 'No transactions yet'}</p></div>;
  return <>{filteredRecentTxs.map((tx: any) => {
    const { amount: fmtAmt, currency: fmtCur } = formatAmountParts(tx.amount, locale, currency);
    return (
      <div key={tx.id} className={styles.txRow} onClick={() => useModalStore.getState().open('transaction-detail', { transaction: tx })}>
        <span className={styles.txType} data-type={tx.type}><span className={styles.txDay}>{new Date(tx.date).getDate()}</span><span className={styles.txMonth}>{MONTHS[new Date(tx.date).getMonth()]}</span></span>
        <span className={styles.txDate}>{shortDate(tx.date, locale)}</span>
        <span className={styles.txDesc}><Highlight text={tx.description} query={searchQuery} /></span>
        <span className={styles.txAmount}><span className={`${styles.txArrow} ${tx.type === 'income' || tx.type === 'loan_repayment' || tx.type === 'repay' ? styles.txArrowIn : styles.txArrowOut}`}>{tx.type === 'income' || tx.type === 'loan_repayment' || tx.type === 'repay' ? <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 10V2M2 6l4-4 4 4" /></svg> : <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v8M2 6l4 4 4-4" /></svg>}</span>{fmtAmt}<small className={styles.txCurrency}>{fmtCur}</small></span>
      </div>
    );
  })}</>;
}
export function ActiveLoansPanel({ filteredActiveLoanStacks, searchQuery, locale, currency, navigate }: any) {
  if (filteredActiveLoanStacks.length === 0) return <div className="empty-state" style={{ padding: '24px 0' }}><div className="empty-state-icon">{'\u{1F4B3}'}</div><p className="empty-state-text">{searchQuery ? `No loans match "${searchQuery}"` : 'No active loans'}</p></div>;
  return <>{filteredActiveLoanStacks.map((stack: any) => {
    const total = stack.totalOutstanding + stack.totalRecovered; const pct = total > 0 ? (stack.totalRecovered / total) * 100 : 0; const isSettled = stack.loans.every((l: any) => l.status === 'settled');
    return (
      <div key={stack.debtorId} className={styles.loanRow} onClick={() => navigate(`/loans/${stack.debtorId}`)}>
        <div className={styles.loanTop}><span className={styles.loanDebtor}><span className={styles.loanDebtorName}><Highlight text={stack.debtorName} query={searchQuery} /></span><span className={styles.loanBadges}>{isSettled && <span className={`${styles.badge} ${styles.badgeSettled}`}>Settled</span>}{!isSettled && stack.settledCount > 0 && <span className={`${styles.badge} ${styles.badgePartial}`}>Partial</span>}</span></span><span className={styles.loanAmount}>{Intl.NumberFormat(locale).format(stack.totalOutstanding)}<span className={styles.loanCurrency}>{currency}</span></span></div>
        <div className={styles.loanBarWrap}><div className={styles.loanBarFill} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
        <div className={styles.loanMeta}><span>{pct >= 100 ? 'Fully recovered' : `${Math.round(pct)}% recovered`}</span><span>{formatAmount(stack.totalOutstanding, locale, currency)} remaining</span></div>
      </div>
    );
  })}</>;
}
