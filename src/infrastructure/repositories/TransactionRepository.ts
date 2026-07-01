import type { IDatabaseService, TransactionFilter } from '../../core/ports/IDatabaseService';
import type { Transaction, TransactionType } from '../../core/domain/Transaction';

export class TransactionRepository {
  constructor(private db: IDatabaseService) {}

  async findAll(filters?: TransactionFilter): Promise<Transaction[]> {
    return this.db.getTransactions(filters);
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.db.getTransactionById(id);
  }

  async findByMember(memberId: string, limit?: number): Promise<Transaction[]> {
    return this.db.getTransactions({ memberId, limit });
  }

  async findByType(type: TransactionType, limit?: number): Promise<Transaction[]> {
    return this.db.getTransactions({ type, limit });
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    return this.db.getTransactions({ startDate, endDate });
  }

  async findByLoanRef(loanRef: string): Promise<Transaction[]> {
    const all = await this.db.getTransactions();
    return all.filter((t) => t.loanRef === loanRef);
  }

  async findRecent(limit: number = 20): Promise<Transaction[]> {
    return this.db.getTransactions({ limit });
  }

  async save(transaction: Transaction): Promise<void> {
    return this.db.saveTransaction(transaction);
  }

  async update(id: string, transaction: Transaction): Promise<void> {
    return this.db.updateTransaction(id, transaction);
  }

  async softDelete(id: string): Promise<void> {
    return this.db.softDeleteTransaction(id);
  }

  async restore(id: string): Promise<void> {
    return this.db.restoreTransaction(id);
  }

  async purge(id: string): Promise<void> {
    return this.db.purgeTransaction(id);
  }
}
