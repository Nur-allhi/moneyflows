import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Avatar, AccountCard, LedgerTable, SegmentedTabs, QuickActionCard, GlassPanel, Modal, FormInput, FormSelect, AmountInput } from '../components';
import type { LedgerRow } from '../components';
import { useAnimatedValue } from '../hooks';
import { useMemberStore } from '../stores/useMemberStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { Account } from '../../core/domain/Account';
import type { AccountType } from '../../core/domain/Account';
import { formatAmount } from '../utils/format';
import { shortDate } from '../constants/dates';
import { ACCOUNT_TYPE_GRADIENT_THREE, ACCOUNT_TYPE_OPTIONS, displayType } from '../constants/labels';
import { ACCOUNT_CARD_WIDTH, CARD_GAP } from '../constants/config';
import styles from './MemberProfile.module.css';

const ledgerFilters = [
  { key: 'all', label: 'All' },
  { key: 'income', label: 'Income' },
  { key: 'expense', label: 'Expense' },
  { key: 'transfer', label: 'Transfer' },
];

export function MemberProfile() {
  const { id: memberId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeDot, setActiveDot] = useState(0);
  const [ledgerFilter, setLedgerFilter] = useState('all');

  const {
    members, loading: mLoading, error: mError,
    fetchMembers,
  } = useMemberStore();
  const {
    accounts, loading: aLoading, error: aError,
    fetchAccounts, saveAccount,
  } = useAccountStore();
  const {
    transactions, loading: tLoading, error: tError,
    fetchTransactions,
  } = useTransactionStore();
  const { locale, currency } = useSettingsStore((s) => s.settings);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [acctName, setAcctName] = useState('');
  const [acctType, setAcctType] = useState<AccountType>('bank');
  const [acctBalance, setAcctBalance] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (memberId) {
      fetchAccounts(memberId);
      fetchTransactions();
    }
  }, [memberId]);

  const member = useMemo(
    () => members.find((m) => m.id === memberId) ?? null,
    [members, memberId],
  );

  const memberAccounts = useMemo(
    () => accounts.filter((a) => a.memberId === memberId),
    [accounts, memberId],
  );

  const totalBalance = useMemo(
    () => memberAccounts.reduce((s, a) => s + a.balance, 0),
    [memberAccounts],
  );

  const memberTxs = useMemo(
    () => {
      const acctIds = new Set(memberAccounts.map((a) => a.id));
      return transactions.filter(
        (t) => acctIds.has(t.sourceAccount ?? '') || acctIds.has(t.destAccount ?? ''),
      );
    },
    [transactions, memberAccounts],
  );

  const totalIncome = useMemo(
    () => memberTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [memberTxs],
  );

  const totalExpenses = useMemo(
    () => memberTxs.filter((t) => t.type === 'expense' || t.type === 'loan_issue').reduce((s, t) => s + t.amount, 0),
    [memberTxs],
  );

  const sortedTxs = useMemo(
    () => [...memberTxs].sort((a, b) => a.date.localeCompare(b.date)),
    [memberTxs],
  );

  const ledgerRows: LedgerRow[] = useMemo(() => {
    let running = 0;
    return sortedTxs.map((tx) => {
      const isCredit = tx.type === 'income' || tx.type === 'loan_repayment';
      if (isCredit) running += tx.amount;
      else running -= tx.amount;

      const displayType = tx.type === 'loan_issue' || tx.type === 'loan_repayment' ? 'transfer' as const : tx.type as 'income' | 'expense' | 'transfer';

      return {
        date: shortDate(tx.date, locale),
        description: tx.description,
        debit: isCredit ? '\u2014' : formatAmount(tx.amount, locale, currency),
        credit: isCredit ? formatAmount(tx.amount, locale, currency) : '\u2014',
        balance: formatAmount(running, locale, currency),
        type: displayType,
      };
    }).reverse();
  }, [sortedTxs, locale]);

  const animTotalBalance = useAnimatedValue(totalBalance);
  const animTotalIncome = useAnimatedValue(totalIncome);
  const animTotalExpenses = useAnimatedValue(totalExpenses);

  const filteredLedger = ledgerFilter === 'all'
    ? ledgerRows
    : ledgerRows.filter((row) => row.type === ledgerFilter);

  const handleScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / (ACCOUNT_CARD_WIDTH + CARD_GAP));
    setActiveDot(Math.min(idx, memberAccounts.length - 1));
  }, [memberAccounts.length]);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const loading = mLoading || aLoading || tLoading;
  const error = mError || aError || tError;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className="skeleton skeleton-profile" />
          <div className={styles.carousel}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={`skeleton skeleton-card ${styles.loadingCard}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className={styles.container}>
        <GlassPanel padding="lg">
          <div className="error-state">
            <div className="error-state-icon">{'\u26A0\uFE0F'}</div>
            <p className="error-state-text">{!member ? 'Member not found' : 'Could not load member profile'}</p>
            <button className="retry-btn" onClick={() => fetchMembers()}>Retry</button>
          </div>
        </GlassPanel>
      </div>
    );
  }

  const initial = member.shortName?.[0] ?? member.name[0] ?? '?';

  return (
    <div className={styles.container}>
      <div className={styles.mobileOnly}>
        <div className={styles.profileCard}>
          <Avatar initial={initial} name={member.name} size={72} />
          <div className={styles.profileInfo}>
            <div className={styles.profileName}>{member.name}</div>
            <div className={styles.profileTag}>
              {member.isExternal ? 'External' : 'Family'}
            </div>
          </div>
          <div className={styles.profileBalance}>
            <div className={styles.balanceLabel}>Balance</div>
            <div className={styles.balanceAmount}>{formatAmount(animTotalBalance, locale, currency)}</div>
          </div>
        </div>

        <div className={styles.sectionLabel}>
          Accounts
          <button className={styles.addAcctBtn} onClick={() => setShowAccountModal(true)}>+ Add</button>
        </div>
        <div className={styles.carousel} ref={carouselRef}>
          {memberAccounts.length === 0 ? (
            <div className={styles.emptyState}>
              <p className="empty-state-text">No accounts</p>
              <button className={styles.emptyAddBtn} onClick={() => setShowAccountModal(true)}>+ Add Account</button>
            </div>
          ) : (
            memberAccounts.map((acct) => (
              <AccountCard
                key={acct.id}
                name={acct.name}
                type={displayType(acct.type)}
                balance={formatAmount(acct.balance, locale, currency)}
                accountNumber={acct.id.slice(-4)}
                gradient={ACCOUNT_TYPE_GRADIENT_THREE[acct.type]}
                showChip={acct.type === 'cash'}
              />
            ))
          )}
        </div>
        <div className={styles.carouselDots}>
          {memberAccounts.map((_, i) => (
            <span
              key={i}
              className={`${styles.dot} ${i === activeDot ? styles.dotActive : ''}`}
            />
          ))}
        </div>
      </div>

      <div className={styles.desktopOnly}>
        <div className={styles.profileHero}>
          <Avatar initial={initial} name={member.name} size={72} />
          <div className={styles.heroDetails}>
            <div className={styles.heroName}>{member.name}</div>
            <div className={styles.heroMeta}>
              {member.isExternal ? (
                <span>{'\u{1F465}'} External</span>
              ) : (
                <span>{'\u{1F3C6}'} Family</span>
              )}
              {memberAccounts.slice(0, 3).map((a) => (
                <span key={a.id}>{a.name}</span>
              ))}
            </div>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Net Balance</div>
              <div className={`${styles.statValue} ${styles.statTeal}`}>{formatAmount(animTotalBalance, locale, currency)}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Total Income</div>
              <div className={`${styles.statValue} ${styles.statTeal}`}>{formatAmount(animTotalIncome, locale, currency)}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Total Expenses</div>
              <div className={`${styles.statValue} ${styles.statCoral}`}>{formatAmount(animTotalExpenses, locale, currency)}</div>
            </div>
          </div>
        </div>

        <div className={styles.actionStrip}>
          <QuickActionCard icon={'\u2795'} iconBg="violet" title="Add Income" subtitle="Record a new deposit" onClick={() => navigate('/transaction')} />
          <QuickActionCard icon={'\u2796'} iconBg="coral" title="Log Expense" subtitle="Track a payment" onClick={() => navigate('/transaction')} />
          <QuickActionCard icon={'\u{1F504}'} iconBg="teal" title="Transfer Money" subtitle="Between accounts" onClick={() => navigate('/transaction')} />
        </div>

        <div className={styles.accountsSectionHeader}>
          <h2>Linked Accounts</h2>
          <button className={styles.accountsAction} onClick={() => setShowAccountModal(true)}>+ Add account</button>
        </div>
        <div className={styles.accountsGrid}>
          {memberAccounts.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">No accounts</p>
            </div>
          ) : (
            memberAccounts.map((acct) => (
              <AccountCard
                key={acct.id}
                name={acct.name}
                type={displayType(acct.type)}
                balance={formatAmount(acct.balance, locale, currency)}
                accountNumber={acct.id.slice(-4)}
                gradient={ACCOUNT_TYPE_GRADIENT_THREE[acct.type]}
                showChip={acct.type === 'cash'}
              />
            ))
          )}
        </div>
      </div>

      <div className={styles.contentSplit}>
        <div className={styles.ledgerPanel}>
          <div className={styles.ledgerPanelHead}>
            <h3>Account Ledger</h3>
            <div className={styles.ledgerPanelFilter}>
              <SegmentedTabs
                tabs={ledgerFilters}
                activeKey={ledgerFilter}
                onChange={setLedgerFilter}
              />
            </div>
          </div>
          <LedgerTable rows={filteredLedger} desktop />
        </div>
      </div>

      <Modal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        title="Add Account"
        saveLabel="Add Account"
        onSave={async () => {
          if (!acctName.trim() || !memberId) return;
          const account = new Account(
            uuidv4(), memberId, acctName.trim(), acctType,
            acctBalance ? parseFloat(acctBalance) || 0 : 0,
          );
          await saveAccount(account);
          setAcctName('');
          setAcctType('bank');
          setAcctBalance('');
          setShowAccountModal(false);
        }}
      >
        <FormInput
          label="Account Name"
          placeholder="e.g. bKash, Brac Bank"
          value={acctName}
          onChange={(e) => setAcctName(e.target.value)}
          autoFocus
        />
        <FormSelect
          label="Account Type"
          value={acctType}
          onChange={(e) => setAcctType(e.target.value as AccountType)}
        >
          {ACCOUNT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </FormSelect>
        <AmountInput
          label="Initial Balance (optional)"
          value={acctBalance}
          onChange={setAcctBalance}
          placeholder="0"
        />
      </Modal>
    </div>
  );
}
