import { Avatar } from '../../components';
import { useAnimatedValue } from '../../hooks';
import { useModalStore } from '../../stores/useModalStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { formatAmountParts } from '../../utils/format';
import styles from '../MemberProfile.module.css';
import type { Member } from '../../../core/domain/Member';

interface Props {
  member: Member;
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  selectedAccountId: string | null;
  isDesktop: boolean;
}

function Stat({ label, value, kind }: { label: string; value: number; kind: 'teal' | 'coral' }) {
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const anim = useAnimatedValue(value);
  const fmt = formatAmountParts(anim, locale, currency);
  const cls = kind === 'teal' ? styles.statTeal : styles.statCoral;
  return (
    <div className={styles.statItem}>
      <div className={styles.statLabel}>{label}</div>
      <div className={`${styles.statValue} ${cls}`}>
        {fmt.amount}<small className={styles.statCurrency}>{fmt.currency}</small>
      </div>
    </div>
  );
}

export function ProfileHero({ member, totalBalance, totalIncome, totalExpenses, selectedAccountId, isDesktop }: Props) {
  const initial = member.shortName?.[0] ?? member.name[0] ?? '?';
  if (isDesktop) {
    return (
      <div className={styles.profileHero}>
        <div className={styles.heroLeft}>
          <Avatar initial={initial} seed={member.name} name={member.name} size={72} />
          <div className={styles.heroName}>{member.name} <button className={styles.heroEditBtn} onClick={() => useModalStore.getState().open('edit-member', { memberId: member.id })} aria-label="Edit member name">{'\u270E'}</button></div>
        </div>
        <div className={styles.heroActions}>
          <button className={styles.heroActionBtn} onClick={() => useModalStore.getState().open('transaction-form', { initialSource: selectedAccountId || undefined })}>
            <span className={styles.heroActionIcon}>+</span> Transaction
          </button>
          <button className={styles.heroActionBtn} onClick={() => useModalStore.getState().open('add-account', { memberId: member.id })}>
            <span className={styles.heroActionIcon}>+</span> Account
          </button>
        </div>
        <div className={styles.heroStats}>
          <Stat label="Net Balance" value={totalBalance} kind="teal" />
          <Stat label="Total Income" value={totalIncome} kind="teal" />
          <Stat label="Total Expenses" value={totalExpenses} kind="coral" />
        </div>
      </div>
    );
  }
  return (
    <>
      <div className={styles.profileCard}>
        <Avatar initial={initial} seed={member.name} name={member.name} size={72} />
        <div className={styles.profileName}>{member.name}</div>
        <div className={styles.profileTag}>{member.isExternal ? 'External' : 'Family'}</div>
        <div className={styles.balanceLabel}>Net Balance</div>
        <BalanceAmount value={totalBalance} />
      </div>
      <div className={styles.actionPills}>
        <button className={styles.actionPill} onClick={() => useModalStore.getState().open('transaction-form', { initialTab: 'income', initialSource: selectedAccountId || undefined })}><span className={`${styles.pillIcon} ${styles.pillIncome}`}>{'+$'}</span><span className={styles.pillLabel}>Income</span></button>
        <button className={styles.actionPill} onClick={() => useModalStore.getState().open('transaction-form', { initialTab: 'expense', initialSource: selectedAccountId || undefined })}><span className={`${styles.pillIcon} ${styles.pillExpense}`}>{'-$'}</span><span className={styles.pillLabel}>Expense</span></button>
        <button className={styles.actionPill} onClick={() => useModalStore.getState().open('transaction-form', { initialTab: 'transfer', initialSource: selectedAccountId || undefined })}><span className={`${styles.pillIcon} ${styles.pillTransfer}`}>{'$'}</span><span className={styles.pillLabel}>Transfer</span></button>
      </div>
    </>
  );
}

function BalanceAmount({ value }: { value: number }) {
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const anim = useAnimatedValue(value);
  const fmt = formatAmountParts(anim, locale, currency);
  return <div className={styles.balanceAmount}>{fmt.amount}<small className={styles.statCurrency}>{fmt.currency}</small></div>;
}
