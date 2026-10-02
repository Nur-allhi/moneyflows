import { DEFAULT_DESCRIPTION_MAX_LENGTH, DEFAULT_NUMPAD_MAX_DIGITS, DEFAULT_DASHBOARD_TX_LIMIT } from '../../presentation/constants/config';

/** Appearance theme mode. 'system' follows the OS color scheme. */
export type ThemeMode = 'system' | 'light' | 'dark';

export class AppSettings {
  constructor(
    public currency: string = 'BDT',
    public locale: string = 'en-IN',
    public primaryMemberId: string | null = null,
    public descriptionMaxLength: number = DEFAULT_DESCRIPTION_MAX_LENGTH,
    public numpadMaxDigits: number = DEFAULT_NUMPAD_MAX_DIGITS,
    public dashboardTxLimit: number = DEFAULT_DASHBOARD_TX_LIMIT,
    public lastSeenVersion?: string,
    /** Loan-ledger PDF export: 'all' includes account trail, 'description' omits it. */
    public reportDetailMode: 'all' | 'description' = 'all',
    public showWhereMoneyIs: boolean = true,
    public showRecentTransactions: boolean = true,
    public showActiveLoans: boolean = true,
    public totalAssetsIncludeLoans: boolean = false,
    public setupComplete: boolean = false,
    /** Appearance: resolved by useTheme() into data-theme on <html>. */
    public theme: ThemeMode = 'dark',
    /** Accent id matching a :root[data-accent] block in tokens.css + ACCENTS. */
    public accentId: string = 'violet',
    /** Background preset ids matching [data-bg] blocks in tokens.css + BACKGROUNDS. */
    public bgDark: string = 'obsidian',
    public bgLight: string = 'paper',
    /** Text size id matching [data-font] blocks in tokens.css + FONT_SIZES. */
    public fontSize: string = 'medium',
  ) {}
}
