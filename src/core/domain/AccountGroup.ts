export class AccountGroup {
  constructor(
    public id: string,
    public name: string,
    public sortOrder: number = 0,
    public metadata: Record<string, unknown> = {},
    public deletedAt?: string,
  ) {}
}
