import type { Transaction } from '../../core/domain/Transaction';
import { displayTxType } from '../constants/labels';

function normalize(q: string): string {
  return q.toLowerCase().trim().normalize('NFKD');
}

export interface SearchContext {
  accountMap?: Map<string, { name: string }>;
  memberMap?: Map<string, { name: string }>;
  resolveAccountDisplay?: (tx: Transaction) => string;
  shortDateFn?: (iso: string) => string;
}

/**
 * Returns true if `tx` matches `rawQuery` in any searchable field:
 * description, amount (string), type label, account display, member (via debtor_id lookup),
 * tags, date (shortDate).
 */
export function matchesTx(tx: Transaction, rawQuery: string, ctx: SearchContext = {}): boolean {
  const q = normalize(rawQuery);
  if (!q) return true;

  if (tx.description.toLowerCase().includes(q)) return true;

  if (String(tx.amount).includes(q)) return true;

  const typeLabel = displayTxType(tx.type).toLowerCase();
  if (typeLabel.includes(q)) return true;
  if (tx.type.toLowerCase().includes(q)) return true;

  if (ctx.resolveAccountDisplay) {
    try {
      const disp = ctx.resolveAccountDisplay(tx).toLowerCase();
      if (disp.includes(q)) return true;
    } catch {
      // ignore
    }
  } else if (ctx.accountMap) {
    const s = tx.sourceAccount ? (ctx.accountMap.get(tx.sourceAccount)?.name.toLowerCase() ?? '') : '';
    const d = tx.destAccount ? (ctx.accountMap.get(tx.destAccount)?.name.toLowerCase() ?? '') : '';
    if ((s && s.includes(q)) || (d && d.includes(q))) return true;
  }

  if (ctx.memberMap && tx.debtorId) {
    const m = ctx.memberMap.get(tx.debtorId)?.name.toLowerCase();
    if (m && m.includes(q)) return true;
  }

  const tags = (tx.metadata as Record<string, unknown> | undefined)?.tags;
  if (Array.isArray(tags)) {
    for (const t of tags as string[]) {
      if (String(t).toLowerCase().includes(q)) return true;
    }
  }

  if (ctx.shortDateFn) {
    try {
      const sd = ctx.shortDateFn(tx.date).toLowerCase();
      if (sd.includes(q)) return true;
    } catch {
      // ignore
    }
  } else if (tx.date.toLowerCase().includes(q)) {
    return true;
  }

  return false;
}

export function matchesAccount(
  name: string,
  memberName: string,
  rawQuery: string,
  typeLabel?: string,
): boolean {
  const q = normalize(rawQuery);
  if (!q) return true;
  if (name.toLowerCase().includes(q)) return true;
  if (memberName.toLowerCase().includes(q)) return true;
  if (typeLabel && typeLabel.toLowerCase().includes(q)) return true;
  return false;
}

export function matchesLoanStack(debtorName: string, rawQuery: string): boolean {
  const q = normalize(rawQuery);
  if (!q) return true;
  return debtorName.toLowerCase().includes(q);
}
