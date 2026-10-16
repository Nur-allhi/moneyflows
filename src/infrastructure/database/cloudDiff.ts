/**
 * Side-by-side conflict comparison (T-169): summarizes two database snapshots
 * (local bytes vs downloaded remote bytes) so the conflict dialog can show
 * WHAT differs — counts, latest items with amounts, and recency — instead of
 * asking a blind question.
 *
 * Split for testability: `summarizeRows()` is pure (unit-tested with stubs);
 * the thin `extractSide()` wrapper runs the half-dozen capped queries against
 * a sql.js handle. Corrupt/unreadable bytes yield null → plain-dialog fallback.
 */

import type { Database as SqlJsDb } from 'sql.js';
import type { PreviewTx, SideSummary } from '../../core/ports/IDatabaseService';

export interface TxRow {
  id: string;
  type: string;
  description: string;
  amount: number;
  date: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CountRow {
  id: string;
  updated_at: string;
  deleted_at: string | null;
}

const OUTFLOW_TYPES = new Set(['expense', 'lend', 'loan_issue', 'loan_paidback', 'repay']);

export function signedAmount(type: string | undefined, amount: number | undefined): number {
  const value = amount ?? 0;
  if (!type || type === 'transfer') return value;
  return OUTFLOW_TYPES.has(type) ? -Math.abs(value) : Math.abs(value);
}

const isLive = (deletedAt: string | null | undefined): boolean => !deletedAt;

export function summarizeRows(args: {
  transactions: TxRow[];
  accounts: CountRow[];
  members: CountRow[];
}): SideSummary {
  const { transactions, accounts, members } = args;
  const liveTx = transactions.filter((t) => isLive(t.deleted_at));
  const latest: PreviewTx[] = [...liveTx]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)
    .map((t) => ({
      description: t.description,
      amount: signedAmount(t.type, t.amount),
      date: t.date,
    }));
  const stamps: string[] = [
    ...liveTx.map((t) => t.updated_at),
    ...accounts.filter((a) => isLive(a.deleted_at)).map((a) => a.updated_at),
    ...members.filter((m) => isLive(m.deleted_at)).map((m) => m.updated_at),
  ].filter(Boolean);
  return {
    transactions: liveTx.length,
    accounts: accounts.filter((a) => isLive(a.deleted_at)).length,
    members: members.filter((m) => isLive(m.deleted_at)).length,
    latest,
    lastChange: stamps.length > 0 ? [...stamps].sort().reverse()[0]! : null,
  };
}

/**
 * Thin SQL wrapper: seven capped queries per side (counts + maxima use
 * indexes; detail rows capped at 200 newest). Throws on corrupt bytes —
 * callers convert to the plain-dialog fallback.
 */
export function extractSide(db: SqlJsDb): SideSummary {
  const scalar = (sql: string): number | string | null => {
    const stmt = db.prepare(sql);
    try {
      if (!stmt.step()) return null;
      const row = stmt.getAsObject() as Record<string, unknown>;
      const value = row[Object.keys(row)[0]!] ?? null;
      return typeof value === 'number' || typeof value === 'string' ? value : null;
    } finally {
      stmt.free();
    }
  };
  const txStmt = db.prepare(
    'SELECT id, type, description, amount, date, updated_at, deleted_at FROM transactions ORDER BY date DESC LIMIT 200',
  );
  const transactions: TxRow[] = [];
  try {
    while (txStmt.step()) transactions.push(txStmt.getAsObject() as unknown as TxRow);
  } finally {
    txStmt.free();
  }
  const count = (table: string): number =>
    Number(scalar(`SELECT COUNT(*) AS n FROM ${table} WHERE deleted_at IS NULL`) ?? 0);
  const maxStamp = (table: string): string | null => {
    const value = scalar(`SELECT MAX(updated_at) AS m FROM ${table} WHERE deleted_at IS NULL`);
    return typeof value === 'string' ? value : null;
  };
  const liveTx = transactions.filter((t) => isLive(t.deleted_at));
  const latest: PreviewTx[] = [...liveTx]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)
    .map((t) => ({
      description: t.description,
      amount: signedAmount(t.type, t.amount),
      date: t.date,
    }));
  const stamps = [
    ...liveTx.map((t) => t.updated_at),
    maxStamp('accounts'),
    maxStamp('members'),
  ].filter((s): s is string => !!s);
  return {
    transactions: count('transactions'),
    accounts: count('accounts'),
    members: count('members'),
    latest,
    lastChange: stamps.length > 0 ? [...stamps].sort().reverse()[0]! : null,
  };
}
