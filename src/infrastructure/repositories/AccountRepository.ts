import type { IDatabaseService } from '../../core/ports/IDatabaseService';
import type { Account, AccountType } from '../../core/domain/Account';

export class AccountRepository {
  constructor(private db: IDatabaseService) {}

  async findAllByMember(memberId: string): Promise<Account[]> {
    return this.db.getAccounts(memberId);
  }

  async findAll(): Promise<Account[]> {
    return this.db.getAccounts();
  }

  async findById(id: string): Promise<Account | null> {
    return this.db.getAccountById(id);
  }

  async findByType(type: AccountType): Promise<Account[]> {
    const all = await this.db.getAccounts();
    return all.filter((a) => a.type === type);
  }

  async findActive(): Promise<Account[]> {
    const all = await this.db.getAccounts();
    return all.filter((a) => a.isActive);
  }

  async save(account: Account): Promise<void> {
    return this.db.saveAccount(account);
  }

  async softDelete(id: string): Promise<void> {
    return this.db.softDeleteAccount(id);
  }

  async restore(id: string): Promise<void> {
    return this.db.restoreAccount(id);
  }

  async purge(id: string): Promise<void> {
    return this.db.purgeAccount(id);
  }
}
