import { useEffect, useRef } from 'react';
import { AccountCard } from '../../components';
import { useModalStore } from '../../stores/useModalStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { formatAmount } from '../../utils/format';
import { displayType, ACCOUNT_TYPE_GRADIENT_THREE } from '../../constants/labels';
import styles from '../MemberProfile.module.css';
import type { Account } from '../../../core/domain/Account';

interface Props {
  memberAccounts: Account[];
  selectedAccountId: string | null;
  accountsOpen: boolean;
  setAccountsOpen: (v: boolean) => void;
  onAccountClick: (id: string) => void;
  isDesktop: boolean;
  memberId: string;
  onSelectAccount: (id: string | null) => void;
}

export function AccountsSection({ memberAccounts, selectedAccountId, accountsOpen, setAccountsOpen, onAccountClick, isDesktop, memberId, onSelectAccount }: Props) {
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!accountsOpen || !isDesktop) return;
    const onDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setAccountsOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [accountsOpen, isDesktop, setAccountsOpen]);
  if (isDesktop) {
    return (
      <div className={styles.accountsDropdown} ref={dropdownRef}>
        <div className={styles.accountsDropdownHeader} onClick={() => setAccountsOpen(!accountsOpen)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setAccountsOpen(!accountsOpen)}>
          <h2>Linked Accounts <span className={styles.acctCount}>{memberAccounts.length}</span></h2>
          <svg className={`${styles.accountsChevron} ${accountsOpen ? styles.chevronOpen : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg>
        </div>
        <div className={`${styles.accountsSlide} ${accountsOpen ? styles.accountsOpen : ''}`}>
          <div className={styles.accountsSlideInner}>
            <div className={styles.accountsGrid}>
              {memberAccounts.length === 0 ? (
                <div className="empty-state"><p className="empty-state-text">No accounts</p></div>
              ) : (
                memberAccounts.map((acct) => (
                  <AccountCard
                    key={acct.id}
                    name={acct.name}
                    type={displayType(acct.type)}
                    balance={formatAmount(acct.balance, locale, currency)}
                    gradient={ACCOUNT_TYPE_GRADIENT_THREE[acct.type]}
                    onClick={() => onAccountClick(acct.id)}
                    selected={selectedAccountId === acct.id}
                    actions={
                      <button className={styles.acctActionBtn} title="Edit account" aria-label={`Edit ${acct.name}`} onClick={() => useModalStore.getState().open('edit-account', { accountId: acct.id })}>
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M10.5 1.5l2 2L5 11l-2.7.7L3 8.9l7.5-7.4z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    }
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.mobileLinkedAccounts} onClick={() => useModalStore.getState().open('select-account', { memberId, selectedAccountId, onSelect: onSelectAccount })} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && useModalStore.getState().open('select-account', { memberId, selectedAccountId, onSelect: onSelectAccount })}>
      <div className={styles.linkedAccountsLabel}><span>Linked Accounts</span><span className={styles.linkedAcctCount}>{memberAccounts.length}</span></div>
      <svg className={styles.linkedChevron} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M6 4l4 4-4 4" /></svg>
    </div>
  );
}
