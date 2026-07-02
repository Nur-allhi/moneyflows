export type TransactionType = 'income' | 'expense' | 'transfer' | 'loan_issue' | 'loan_repayment' | 'loan_received' | 'loan_paidback' | 'lend' | 'repay';

export class Transaction {
  constructor(
    public id: string,
    public type: TransactionType,
    public description: string,
    public amount: number,
    public memberId: string,
    public date: string,
    public sourceAccount?: string,
    public destAccount?: string,
    public debtorId?: string,
    public loanRef?: string,
    public metadata: Record<string, unknown> = {},
    public createdAt: string = new Date().toISOString(),
    public updatedAt: string = new Date().toISOString(),
    public deletedAt?: string,
  ) {}
}
