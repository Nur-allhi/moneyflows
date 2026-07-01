export class AppSettings {
  constructor(
    public currency: string = 'BDT',
    public locale: string = 'en-IN',
    public primaryMemberId: string | null = null,
    public descriptionMaxLength: number = 200,
    public numpadMaxDigits: number = 10,
    public dashboardTxLimit: number = 10,
  ) {}
}
