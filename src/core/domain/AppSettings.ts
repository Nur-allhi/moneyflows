import { DEFAULT_DESCRIPTION_MAX_LENGTH, DEFAULT_NUMPAD_MAX_DIGITS, DEFAULT_DASHBOARD_TX_LIMIT } from '../../presentation/constants/config';

export class AppSettings {
  constructor(
    public currency: string = 'BDT',
    public locale: string = 'en-IN',
    public primaryMemberId: string | null = null,
    public descriptionMaxLength: number = DEFAULT_DESCRIPTION_MAX_LENGTH,
    public numpadMaxDigits: number = DEFAULT_NUMPAD_MAX_DIGITS,
    public dashboardTxLimit: number = DEFAULT_DASHBOARD_TX_LIMIT,
  ) {}
}
