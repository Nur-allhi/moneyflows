export type AccountType = 'bank' | 'mobile_wallet' | 'cash' | 'savings' | 'business' | 'counterparty';

export class Account {
  constructor(
    public id: string,
    public memberId: string | undefined,
    public name: string,
    public type: AccountType,
    public balance: number = 0,
    public currency: string = 'BDT',
    public icon?: string,
    public color?: string,
    public isActive: boolean = true,
    public metadata: Record<string, unknown> = {},
    public createdAt: string = new Date().toISOString(),
    public updatedAt: string = new Date().toISOString(),
    public deletedAt?: string,
  ) {}
}
