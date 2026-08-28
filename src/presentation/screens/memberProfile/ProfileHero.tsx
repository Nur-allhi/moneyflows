import { Avatar } from '../../components';
import { useAnimatedValue } from '../../hooks';
import { useModalStore } from '../../stores/useModalStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { formatAmount } from '../../utils/format';
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

export function ProfileHero({ member, totalBalance, totalIncome, totalExpenses, selectedAccountId, isDesktop }: Props) {
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const animBal = useAnimatedValue(totalBalance);
  const animInc = useAnimatedValue(totalIncome);
  const animExp = useAnimatedValue(totalExpenses);
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
          <div className={styles.statItem}><div className={styles.statLabel}>Net Balance</div><div className={`${styles.statValue} ${styles.statTeal}`}>{formatAmount(animBal, locale, currency)}</div></div>
          <div className={styles.statItem}><div className={styles.statLabel}>Total Income</div><div className={`${styles.statValue} ${styles.statTeal}`}>{formatAmount(animInc, locale, currency)}</div></div>
          <div className={styles.statItem}><div className={styles.statLabel}>Total Expenses</div><div className={`${styles.statValue} ${styles.statCoral}`}>{formatAmount(animExp, locale, currency)}</div></div>
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
        <div className={styles.balanceAmount}>{formatAmount(animBal, locale, currency)}</div>
      </div>
      <div className={styles.actionPills}>
        <button className={styles.actionPill} onClick={() => useModalStore.getState().open('transaction-form', { initialTab: 'income', initialSource: selectedAccountId || undefined })}><span className={`${styles.pillIcon} ${styles.pillIncome}`}>{'+$'}</span><span className={styles.pillLabel}>Income</span></button>
        <button className={styles.actionPill} onClick={() => useModalStore.getState().open('transaction-form', { initialTab: 'expense', initialSource: selectedAccountId || undefined })}><span className={`${styles.pillIcon} ${styles.pillExpense}`}>{'-$'}</span><span className={styles.pillLabel}>Expense</span></button>
        <button className={styles.actionPill} onClick={() => useModalStore.getState().open('transaction-form', { initialTab: 'transfer', initialSource: selectedAccountId || undefined })}><span className={`${styles.pillIcon} ${styles.pillTransfer}`}>{'$'}</span><span className={styles.pillLabel}>Transfer</span></button>
      </div>
    </>
  );
}
