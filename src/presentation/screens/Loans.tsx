import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProgressBar, LoanStack, GlassPanel } from '../components';
import type { LoanStackData } from '../components';
import { useLoanStore } from '../stores/useLoanStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useMemberStore } from '../stores/useMemberStore';
import type { LoanStack as LoanStackType } from '../../core/domain/Loan';
import type { Account } from '../../core/domain/Account';
import type { Member } from '../../core/domain/Member';
import { formatAmount } from '../utils/format';
import { shortDate } from '../constants/dates';
import { displayType } from '../constants/labels';
import type { AccountType } from '../../core/domain/Account';
import styles from './Loans.module.css';

const GRADIENTS = [
  'linear-gradient(135deg,#1a237e,#283593)',
  'linear-gradient(135deg,#d81b60,#e91e63)',
  'linear-gradient(135deg,#37474f,#546e7a)',
  'linear-gradient(135deg,#004d40,#00695c)',
  'linear-gradient(135deg,#4a148c,#6a1b9a)',
];

function LoanDetailView({ stack, accounts, members }: { stack: LoanStackType; accounts: Account[]; members: Member[] }) {
  const navigate = useNavigate();
  const { locale, currency } = useSettingsStore((s) => s.settings);

  const memberById = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members]);
  const accountById = useMemo(() => Object.fromEntries(accounts.map((a) => [a.id, a])), [accounts]);

  const debtorSummary = (() => {
    const total = stack.totalOutstanding;
    const recovered = stack.totalRecovered;
    const issued = total + recovered;
    const pct = issued > 0 ? Math.round((recovered / issued) * 100) : 0;
    return {
      name: stack.debtorName,
      badge: 'Individual',
      registered: `${stack.loans.length} active loan${stack.loans.length !== 1 ? 's' : ''}`,
      totalOutstanding: formatAmount(total, locale, currency),
      repaidPercent: pct,
      repaidDetail: `${pct}% repaid \u2022 ${formatAmount(total, locale, currency)} remaining`,
    };
  })();

  const stackData: LoanStackData[] = stack.loans.map((loan, i) => {
    const acct = accountById[loan.fundingSource];
    const name = acct?.name ?? loan.fundingSource;
    const type: AccountType = acct?.type ?? 'bank';
    const fundingMember = acct ? memberById[acct.memberId] : null;
    const fundingName = fundingMember?.name ?? 'Unknown';
    const gradient = GRADIENTS[i % GRADIENTS.length]!;
    const icon = name.slice(0, 1).toUpperCase();
    const recovered = loan.recovered;
    const outstanding = loan.amount - recovered;
    return {
      icon,
      iconGradient: gradient,
      fundSource: `Funded by ${fundingName} \u2014 ${name}`,
      sourceMeta: `Source: ${displayType(type)} \u2022 Disbursed ${shortDate(loan.date, locale)}`,
      totalAmount: formatAmount(loan.amount, locale, currency),
      totalColor: 'var(--color-expense)' as const,
      loanCount: 1,
      loans: [{
        description: loan.fundingSource,
        date: shortDate(loan.date, locale),
        amount: formatAmount(loan.amount, locale, currency),
        remaining: formatAmount(outstanding, locale, currency),
        remainingColor: outstanding > 0 ? 'var(--color-expense)' as const : 'var(--color-income)' as const,
        status: loan.status,
      }],
    };
  });

  return (
    <div className={styles.loans}>
      <button className={styles.backBtn} onClick={() => navigate('/loans')}>
        {'\u2190'} All Debtors
      </button>

      <div className={styles.summary}>
        <div className={styles.summaryTop}>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLabel}>Debtor</span>
            <div className={styles.summaryDebtor}>
              {debtorSummary.name}
              <span className={styles.badge}>{debtorSummary.badge}</span>
            </div>
            <span className={styles.summaryRegistered}>{debtorSummary.registered}</span>
          </div>
          <div className={styles.summaryAmount}>
            <div className={styles.summaryValue}>{debtorSummary.totalOutstanding}</div>
            <div className={styles.summaryAmountLabel}>Total Outstanding</div>
          </div>
        </div>
        <ProgressBar
          percent={debtorSummary.repaidPercent}
          label="Repayment Progress"
          sublabel={debtorSummary.repaidDetail}
        />
      </div>

      <LoanStack stacks={stackData} />
    </div>
  );
}

export function Loans() {
  const { debtorId: routeDebtorId } = useParams<{ debtorId: string }>();
  const navigate = useNavigate();
  const { loanStacks, loading, error, fetchLoanStacks } = useLoanStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const { members, fetchMembers } = useMemberStore();

  useEffect(() => {
    fetchLoanStacks();
    fetchAccounts();
    fetchMembers();
  }, []);

  const selectedStack = useMemo(() => {
    if (!routeDebtorId || loanStacks.length === 0) return null;
    return loanStacks.find((s) => s.debtorId === routeDebtorId) ?? null;
  }, [loanStacks, routeDebtorId]);

  if (loading) {
    return (
      <div className={styles.loans}>
        <div className="skeleton skeleton-summary" />
        <div className={styles.loadingStacks}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton-stack" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.loans}>
        <GlassPanel padding="lg">
          <div className="error-state">
            <div className="error-state-icon">{'\u26A0\uFE0F'}</div>
            <p className="error-state-text">Could not load loan data</p>
            <button className="retry-btn" onClick={fetchLoanStacks}>Retry</button>
          </div>
        </GlassPanel>
      </div>
    );
  }

  if (routeDebtorId && selectedStack) {
    return <LoanDetailView stack={selectedStack} accounts={accounts} members={members} />;
  }

  if (routeDebtorId && !selectedStack) {
    return (
      <div className={styles.loans}>
        <GlassPanel padding="lg">
          <div className="empty-state">
            <div className="empty-state-icon">{'\u{1F50D}'}</div>
            <p className="empty-state-text">Debtor not found</p>
            <button className="retry-btn" onClick={() => navigate('/loans')}>View all debtors</button>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className={styles.loans}>
      <div className={styles.listHeader}>
        <h2 className={styles.listTitle}>Loan Receivables</h2>
        <span className={styles.listCount}>{loanStacks.length} debtor{loanStacks.length !== 1 ? 's' : ''}</span>
      </div>

      {loanStacks.length === 0 ? (
        <GlassPanel padding="lg">
          <div className="empty-state">
            <div className="empty-state-icon">{'\u{1F4B5}'}</div>
            <p className="empty-state-text">No active loans</p>
          </div>
        </GlassPanel>
      ) : (
        <div className={styles.debtorGrid}>
          {loanStacks.map((stack, i) => {
            const total = stack.totalOutstanding;
            const recovered = stack.totalRecovered;
            const issued = total + recovered;
            const pct = issued > 0 ? Math.round((recovered / issued) * 100) : 0;
            return (
              <button
                key={stack.debtorId}
                className={styles.debtorCard}
                onClick={() => navigate(`/loans/${stack.debtorId}`)}
              >
                <div className={styles.debtorCardTop}>
                  <div className={styles.debtorIcon} style={{ '--debtor-bg': GRADIENTS[i % GRADIENTS.length] } as React.CSSProperties}>
                    {stack.debtorName.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.debtorCardInfo}>
                    <span className={styles.debtorName}>{stack.debtorName}</span>
                    <span className={styles.debtorCount}>{stack.loans.length} loan{stack.loans.length !== 1 ? 's' : ''}</span>
                  </div>
                  <span className={styles.debtorAmount}>{formatAmount(total, locale, currency)}</span>
                </div>
                <ProgressBar percent={pct} label="" sublabel={`${pct}% repaid`} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
