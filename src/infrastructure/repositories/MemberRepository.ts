import type { IDatabaseService } from '../../core/ports/IDatabaseService';
import type { Member } from '../../core/domain/Member';

export class MemberRepository {
  constructor(private db: IDatabaseService) {}

  async findAll(includeDeleted?: boolean): Promise<Member[]> {
    return this.db.getMembers(includeDeleted);
  }

  async findById(id: string): Promise<Member | null> {
    return this.db.getMemberById(id);
  }

  async findByShortName(shortName: string): Promise<Member | null> {
    const members = await this.db.getMembers();
    return members.find((m) => m.shortName === shortName) ?? null;
  }

  async findExternal(): Promise<Member[]> {
    const members = await this.db.getMembers();
    return members.filter((m) => m.isExternal);
  }

  async save(member: Member): Promise<void> {
    return this.db.saveMember(member);
  }

  async softDelete(id: string): Promise<void> {
    return this.db.softDeleteMember(id);
  }

  async restore(id: string): Promise<void> {
    return this.db.restoreMember(id);
  }

  async purge(id: string): Promise<void> {
    return this.db.purgeMember(id);
  }
}
