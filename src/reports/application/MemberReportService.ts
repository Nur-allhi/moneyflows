import type { IDatabaseService } from '../../core/ports/IDatabaseService';
import type { Transaction } from '../../core/domain/Transaction';
import type { OtherLedgerEntry } from '../../otherLedgers/domain/types';
import type {
  AccountSection,
  LoanSection,
  MemberReport,
  MemberReportFilter,
  MemberReportRow,
  OtherLedgerSection,
} from '../domain/types';
import { buildLoanSections, buildOtherLedgerSections } from './memberReportSections';

const dayOf = (iso: string): string => iso.slice(0, 10);

const typeLabelOf = (type: string): string =>
  type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function expandMonth(filter: MemberReportFilter): { start?: string; end?: string } {
  if (!filter.month || !filter.month.includes('-')) {
    return { start: filter.startDate, end: filter.endDate };
  }
  const [y, m] = filter.month.split('-');
  if (!y || !m) return { start: filter.startDate, end: filter.endDate };
  const monthNum = parseInt(m, 10);
  if (Number.isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return { start: filter.startDate, end: filter.endDate };
  }
  const start = `${y}-${String(monthNum).padStart(2, '0')}-01`;
  const endDate = new Date(parseInt(y, 10), monthNum, 0);
  const end = endDate.toISOString().slice(0, 10);
  return { start: filter.startDate ?? start, end: filter.endDate ?? end };
}

/**
 * Single source of truth for member-wise balances (T-132, accounts only).
 * Running balances are ALWAYS derived from FULL history; date filters only
 * choose which rows are displayed — same rule as LoanService.generateReport.
 * Live `account.balance` is the closing truth; opening is back-computed so
 * reports stay correct with or without an explicit opening-balance tx.
 */
export class MemberReportService {
  constructor(private db: IDatabaseService) {}

  async generateReport(filter: MemberReportFilter): Promise<MemberReport> {
    const generatedAt = new Date().toISOString();
    const member = await this.db.getMemberById(filter.memberId);
    if (!member) throw new Error(`Member ${filter.memberId} not found`);

    const owned = (await this.db.getAccounts(filter.memberId)).filter((a) => !a.deletedAt);
    const wanted = filter.accountIds && filter.accountIds.length > 0
      ? new Set(filter.accountIds)
      : null;
    const accounts = wanted ? owned.filter((a) => wanted.has(a.id)) : owned;
    const empty: MemberReport = {
      summary: {
        memberId: member.id, memberName: member.name,
        periodStart: '', periodEnd: '',
        opening: 0, totalDebit: 0, totalCredit: 0, closing: 0,
        transactionCount: 0, accountCount: accounts.length,
      },
      accounts: accounts.map((a) => ({
        accountId: a.id, accountName: a.name,
        opening: a.balance, totalDebit: 0, totalCredit: 0, closing: a.balance, rows: [],
      })),
      loans: [],
      otherLedgers: [],
      filter,
      generatedAt,
    };
    if (accounts.length === 0) return empty;

    const { start, end } = expandMonth(filter);
    const allIds = owned.map((a) => a.id);
    const allTxs = (await this.db.getTransactions({ accountIds: allIds }))
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    const allAccounts = await this.db.getAccounts();
    const accountById = new Map(allAccounts.map((a) => [a.id, a]));
    const memberNameById = new Map((await this.db.getMembers()).map((m) => [m.id, m.name]));
    // Counterparty label: same-member accounts show the bare name, other
    // members show "Member / Account" so linked rows stay identifiable.
    // Only a truly missing account reads as "(deleted account)".
    const counterpartyLabel = (otherId: string): string => {
      const acct = accountById.get(otherId);
      if (!acct) return '(deleted account)';
      if (!acct.memberId || acct.memberId === filter.memberId) return acct.name;
      const owner = memberNameById.get(acct.memberId);
      return owner ? `${owner} / ${acct.name}` : acct.name;
    };
    const inPeriod = (tx: Transaction): boolean => {
      const d = dayOf(tx.date);
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    };
    const isBefore = (tx: Transaction): boolean => !!start && dayOf(tx.date) < start;

    const sections: AccountSection[] = [];
    let shownFirst = '';
    let shownLast = '';

    for (const acct of accounts) {
      const full = allTxs.filter(
        (t) => t.sourceAccount === acct.id || t.destAccount === acct.id,
      );
      // dest wins ties (self-transfer shows as credit with zero net effect).
      const effectOf = (t: Transaction): { debit: number; credit: number } =>
        t.destAccount === acct.id
          ? { debit: 0, credit: t.amount }
          : { debit: t.amount, credit: 0 };
      const netFull = full.reduce((s, t) => {
        const { debit, credit } = effectOf(t);
        return s + credit - debit;
      }, 0);
      const impliedOpening = acct.balance - netFull;
      const prePeriod = full
        .filter(isBefore)
        .reduce((s, t) => {
          const { debit, credit } = effectOf(t);
          return s + credit - debit;
        }, 0);
      let running = impliedOpening + prePeriod;
      const rows: MemberReportRow[] = [];
      for (const tx of full) {
        if (!inPeriod(tx)) continue;
        const { debit, credit } = effectOf(tx);
        running += credit - debit;
        const otherId = credit > 0 ? tx.sourceAccount : tx.destAccount;
        const counterpartyAccount = !otherId || otherId === acct.id
          ? ''
          : counterpartyLabel(otherId);
        rows.push({
          id: tx.id,
          date: tx.date,
          type: tx.type,
          typeLabel: typeLabelOf(tx.type),
          description: tx.description,
          debit,
          credit,
          runningBalance: running,
          counterpartyAccount,
        });
        if (!shownFirst || tx.date < shownFirst) shownFirst = tx.date;
        if (!shownLast || tx.date > shownLast) shownLast = tx.date;
      }
      const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
      const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
      sections.push({
        accountId: acct.id,
        accountName: acct.name,
        opening: running - (totalCredit - totalDebit),
        totalDebit,
        totalCredit,
        closing: acct.balance,
        rows,
      });
    }

    const summaryOpening = sections.reduce((s, x) => s + x.opening, 0);
    const summaryDebit = sections.reduce((s, x) => s + x.totalDebit, 0);
    const summaryCredit = sections.reduce((s, x) => s + x.totalCredit, 0);
    const summaryClosing = sections.reduce((s, x) => s + x.closing, 0);

    const includedIds = new Set(accounts.map((a) => a.id));
    const scopedTxs = allTxs.filter(
      (t) =>
        (t.sourceAccount != null && includedIds.has(t.sourceAccount)) ||
        (t.destAccount != null && includedIds.has(t.destAccount)),
    );

    let loans: LoanSection[] = [];
    if (filter.includeLoans) {
      const allNameById = (id: string): string => {
        const a = accountById.get(id);
        if (!a) return '(deleted account)';
        if (!a.memberId || a.memberId === member.id) return a.name;
        const owner = memberNameById.get(a.memberId);
        return owner ? `${owner} / ${a.name}` : a.name;
      };
      const ownedNames = new Map(owned.map((a) => [a.id, a.name]));
      loans = buildLoanSections(
        scopedTxs,
        allNameById,
        (tx, counterpartyId) => {
          const ownId = [tx.sourceAccount, tx.destAccount].find(
            (x) => x != null && x !== counterpartyId && ownedNames.has(x),
          );
          return ownId != null ? (ownedNames.get(ownId) ?? '') : '';
        },
        // Member perspective: money leaving an included account is a debit.
        (tx) => tx.sourceAccount != null && includedIds.has(tx.sourceAccount),
        { start, end },
      );
    }

    let otherLedgers: OtherLedgerSection[] = [];
    if (filter.includeOtherLedgers) {
      const mine = (await this.db.getOtherLedgers()).filter(
        (l) => !l.deletedAt && l.ownerType === 'member' && l.ownerMemberId === member.id,
      );
      const entriesByLedger = new Map<string, OtherLedgerEntry[]>();
      for (const l of mine) {
        entriesByLedger.set(l.id, await this.db.getOtherLedgerEntries(l.id));
      }
      otherLedgers = buildOtherLedgerSections(mine, entriesByLedger, { start, end });
    }

    return {
      summary: {
        memberId: member.id,
        memberName: member.name,
        periodStart: start ?? (shownFirst ? dayOf(shownFirst) : ''),
        periodEnd: end ?? (shownLast ? dayOf(shownLast) : ''),
        opening: summaryOpening,
        totalDebit: summaryDebit,
        totalCredit: summaryCredit,
        closing: summaryClosing,
        transactionCount: sections.reduce((s, x) => s + x.rows.length, 0),
        accountCount: sections.length,
      },
      accounts: sections,
      loans,
      otherLedgers,
      filter,
      generatedAt,
    };
  }
}
