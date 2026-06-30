import { ProgressBar, LoanStack, GlassPanel } from '../components';
import type { LoanStackData } from '../components';
import styles from './Loans.module.css';

interface DebtorSummary {
  name: string;
  badge: string;
  registered: string;
  totalOutstanding: string;
  repaidPercent: number;
  repaidDetail: string;
}

type LoansState = 'loading' | 'error' | 'empty' | 'ready';

interface LoansProps {
  state?: LoansState;
  onRetry?: () => void;
  debtor?: DebtorSummary;
  stacks?: LoanStackData[];
}

const defaultDebtor: DebtorSummary = {
  name: 'BTC',
  badge: 'Individual',
  registered: 'Registered: 12 Jan 2024 \u2022 3 active loans',
  totalOutstanding: '3,55,000 BDT',
  repaidPercent: 38,
  repaidDetail: '38% repaid \u2022 2,18,000 BDT remaining',
};

const defaultStacks: LoanStackData[] = [
  {
    icon: 'B',
    iconGradient: 'linear-gradient(135deg,#1a237e,#283593)',
    fundSource: 'Funded by Efty \u2014 Brac Bank',
    sourceMeta: 'Source: Savings Account \u2022 Disbursed Apr 2024',
    totalAmount: '1,90,000 BDT',
    totalColor: 'var(--color-expense)',
    loanCount: 3,
    loans: [
      { description: 'Personal Loan \u2014 BTC', date: '12 Apr 2024', amount: '80,000 BDT', remaining: '45,000 BDT', remainingColor: 'var(--color-expense)', status: 'active' },
      { description: 'Business Capital', date: '03 Jul 2024', amount: '60,000 BDT', remaining: '22,000 BDT', remainingColor: 'var(--color-income)', status: 'on_track' },
      { description: 'Emergency Fund', date: '19 Nov 2024', amount: '50,000 BDT', remaining: '38,000 BDT', remainingColor: 'var(--color-expense)', status: 'active' },
    ],
  },
  {
    icon: 'K',
    iconGradient: 'linear-gradient(135deg,#d81b60,#e91e63)',
    fundSource: 'Funded by Efty \u2014 bKash',
    sourceMeta: 'Source: Mobile Wallet \u2022 Disbursed Sep 2024',
    totalAmount: '95,000 BDT',
    totalColor: 'var(--color-expense)',
    loanCount: 2,
    loans: [],
  },
  {
    icon: 'C',
    iconGradient: 'linear-gradient(135deg,#37474f,#546e7a)',
    fundSource: 'Funded by Efty \u2014 Business Cash',
    sourceMeta: 'Source: Current Account \u2022 Disbursed Jan 2025',
    totalAmount: '70,000 BDT',
    totalColor: 'var(--color-income)',
    loanCount: 1,
    loans: [],
  },
];

export function Loans({
  state = 'ready',
  onRetry,
  debtor = defaultDebtor,
  stacks = defaultStacks,
}: LoansProps) {
  if (state === 'loading') {
    return (
      <div className={styles.loans}>
        <div className={styles.loadingSummary} />
        <div className={styles.loadingStacks}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.loadingStack} />
          ))}
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className={styles.loans}>
        <GlassPanel padding="lg">
          <div className={styles.error}>
            <div className={styles.errorIcon}>{'\u26A0\uFE0F'}</div>
            <p>Could not load loan data</p>
            <button className={styles.retryBtn} onClick={onRetry}>Retry</button>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className={styles.loans}>
      <div className={styles.summary}>
        <div className={styles.summaryTop}>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLabel}>Debtor</span>
            <div className={styles.summaryDebtor}>
              {debtor.name}
              <span className={styles.badge}>{debtor.badge}</span>
            </div>
            <span className={styles.summaryRegistered}>{debtor.registered}</span>
          </div>
          <div className={styles.summaryAmount}>
            <div className={styles.summaryValue}>{debtor.totalOutstanding}</div>
            <div className={styles.summaryAmountLabel}>Total Outstanding</div>
          </div>
        </div>
        <ProgressBar
          percent={debtor.repaidPercent}
          label="Repayment Progress"
          sublabel={debtor.repaidDetail}
        />
      </div>

      <LoanStack stacks={stacks} />
    </div>
  );
}
