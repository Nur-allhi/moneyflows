import { useNavigate } from 'react-router-dom';
import { Avatar } from '../../components';
import { useAnimatedValue } from '../../hooks';
import { useReplay } from '../../hooks/useReplay';
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
  const finalFmt = formatAmountParts(value, locale, currency);
  const cls = kind === 'teal' ? styles.statTeal : styles.statCoral;
  return (
    <div className={styles.statItem}>
      <div className={styles.statLabel}>{label}</div>
      <div className={`${styles.statValueWrap} ${cls}`}>
        <span className={styles.statValueFinal} aria-hidden="true">{finalFmt.amount}<small className={styles.statCurrency}>{finalFmt.currency}</small></span>
        <span className={`${styles.statValue} ${cls}`}>{fmt.amount}<small className={styles.statCurrency}>{fmt.currency}</small></span>
      </div>
    </div>
  );
}

export function ProfileHero({ member, totalBalance, totalIncome, totalExpenses, selectedAccountId, isDesktop }: Props) {
  const navigate = useNavigate();
  const openReport = () => navigate(`/member/${member.id}/report`);
  const [editKey, replayEdit] = useReplay();
  const [txKey, replayTx] = useReplay();
  const [acctKey, replayAcct] = useReplay();
  const [reportKey, replayReport] = useReplay();
  const [incomeKey, replayIncome] = useReplay();
  const [expenseKey, replayExpense] = useReplay();
  const [transferKey, replayTransfer] = useReplay();
  const [reportMKey, replayReportM] = useReplay();
  const initial = member.shortName?.[0] ?? member.name[0] ?? '?';
  if (isDesktop) {
    return (
      <div className={styles.profileHero}>
        <button className={`${styles.heroEditBtn} ${editKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayEdit(); useModalStore.getState().open('edit-member', { memberId: member.id }); }} aria-label="Edit member name" tabIndex={0}><span className="anim-target" key={editKey}>{'\u270E'}</span></button>
        <div className={styles.heroLeft}>
          <Avatar initial={initial} seed={member.name} name={member.name} size={72} />
          <div className={styles.heroName}>{member.name}</div>
        </div>
        <div className={styles.heroActions}>
          <button className={`${styles.heroActionBtn} ${txKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayTx(); useModalStore.getState().open('transaction-form', { initialSource: selectedAccountId || undefined }); }}>
            <span className="anim-target" key={txKey}><span className={styles.heroActionIcon}>+</span> Transaction</span>
          </button>
          <button className={`${styles.heroActionBtn} ${acctKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayAcct(); useModalStore.getState().open('add-account', { memberId: member.id }); }}>
            <span className="anim-target" key={acctKey}><span className={styles.heroActionIcon}>+</span> Account</span>
          </button>
          <button className={`${styles.heroActionBtn} ${reportKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayReport(); openReport(); }}>
            <span className="anim-target" key={reportKey}><span className={styles.heroActionIcon}>≡</span> Report</span>
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
        <button className={`${styles.actionPill} ${incomeKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayIncome(); useModalStore.getState().open('transaction-form', { initialTab: 'income', initialSource: selectedAccountId || undefined }); }}><span className="anim-target" key={incomeKey}><span className={`${styles.pillIcon} ${styles.pillIncome}`}>{'+$'}</span><span className={styles.pillLabel}>Income</span></span></button>
        <button className={`${styles.actionPill} ${expenseKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayExpense(); useModalStore.getState().open('transaction-form', { initialTab: 'expense', initialSource: selectedAccountId || undefined }); }}><span className="anim-target" key={expenseKey}><span className={`${styles.pillIcon} ${styles.pillExpense}`}>{'-$'}</span><span className={styles.pillLabel}>Expense</span></span></button>
        <button className={`${styles.actionPill} ${transferKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayTransfer(); useModalStore.getState().open('transaction-form', { initialTab: 'transfer', initialSource: selectedAccountId || undefined }); }}><span className="anim-target" key={transferKey}><span className={`${styles.pillIcon} ${styles.pillTransfer}`}>{'$'}</span><span className={styles.pillLabel}>Transfer</span></span></button>
        <button className={`${styles.actionPill} ${reportMKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayReportM(); openReport(); }}><span className="anim-target" key={reportMKey}><span className={`${styles.pillIcon} ${styles.pillTransfer}`}>≡</span><span className={styles.pillLabel}>Report</span></span></button>
      </div>
    </>
  );
}

function BalanceAmount({ value }: { value: number }) {
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const anim = useAnimatedValue(value);
  const fmt = formatAmountParts(anim, locale, currency);
  const finalFmt = formatAmountParts(value, locale, currency);
  return (
    <div className={styles.balanceAmountWrap}>
      <span className={styles.statValueFinal} aria-hidden="true">{finalFmt.amount}<small className={styles.statCurrency}>{finalFmt.currency}</small></span>
      <span className={styles.balanceAmount}>{fmt.amount}<small className={styles.statCurrency}>{fmt.currency}</small></span>
    </div>
  );
}
