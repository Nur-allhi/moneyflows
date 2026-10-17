/**
 * Read-only integrity scan over rows already stored (BUG-41).
 *
 * BUG-24 closed the write path, so no *new* damage can be saved — but rows
 * written before that fix are still in the database and nothing ever
 * re-examined them. This is the detection half of the approved decision:
 * it reports and it **never writes**.
 *
 * A row is reported when it breaks the very rules the write path now enforces,
 * i.e. when it could not be saved today. The rules are the shared ones from
 * `transactionRules`, so the scan cannot disagree with the guard.
 *
 * Deliberately NOT checked:
 * - member/account existence and `is_active`: point-in-time write conditions, not
 *   record integrity — a transaction may legitimately reference an account that
 *   has since been deleted or deactivated.
 * - `accounts.balance` diverging from a replay of the transactions: the boot pass
 *   already reconciles that, silently (see BUG-41 Scope B).
 */
import {
  validateTransactionFields,
  validateTransactionLinks,
  type TransactionLinkInput,
} from './transactionRules';

/** A stored row as the scan sees it. `amount` is NaN when the column had no number. */
export interface StoredTransactionFields extends TransactionLinkInput {
  id: string;
  amount: number;
  description: string;
  date: string;
}

export interface TransactionIntegrityIssue {
  id: string;
  date: string;
  description: string;
  /** Canonical rule messages, in the order the write path would raise them. */
  reasons: string[];
}

export interface IntegrityReport {
  /** How many rows were examined. */
  scanned: number;
  /** One entry per row that breaks at least one rule. */
  issues: TransactionIntegrityIssue[];
}

const issuesAreEmpty = (reasons: (string | undefined)[]): boolean => reasons.every((r) => !r);

/** Reports every stored row the current rules would refuse. Pure, allocation-light, no I/O. */
export function scanTransactions(rows: readonly StoredTransactionFields[]): IntegrityReport {
  const issues: TransactionIntegrityIssue[] = [];

  for (const row of rows) {
    const fields = validateTransactionFields({
      amount: row.amount,
      description: row.description,
      date: row.date,
    });
    const links = validateTransactionLinks(row);
    const candidates = [
      fields.amount,
      fields.description,
      fields.date,
      links.source,
      links.destination,
      links.pairing,
    ];

    if (issuesAreEmpty(candidates)) continue;

    issues.push({
      id: row.id,
      date: row.date,
      description: row.description,
      reasons: candidates.filter((reason): reason is string => !!reason),
    });
  }

  return { scanned: rows.length, issues };
}
