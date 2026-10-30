/**
 * Single source of truth for the rules a transaction's own fields must satisfy.
 *
 * BUG-24 / BUG-31: these rules used to live only in `SQLiteDatabaseService` and
 * were applied on the create path alone — `updateTransaction` validated nothing,
 * so an edit could persist an empty/NaN/negative amount straight into
 * `accounts.balance`. The create form also carried its own, slightly different
 * copy (`parseInt`, digits-only input). Both the database guard and every form
 * now call these functions, so the two paths cannot disagree again.
 */

export const MAX_DESCRIPTION_LENGTH = 200;
export const MAX_AMOUNT_DECIMALS = 2;

export interface TransactionFieldIssues {
  amount?: string;
  description?: string;
  date?: string;
}

export interface TransactionFieldInput {
  amount: number;
  description: string;
  date: string;
}

/**
 * Field-level rules shared by the database guard and both transaction forms.
 * Messages are the canonical ones the database has always thrown.
 */
export function validateTransactionFields(input: TransactionFieldInput): TransactionFieldIssues {
  const issues: TransactionFieldIssues = {};

  if (!input.amount || !isFinite(input.amount) || input.amount <= 0) {
    issues.amount = 'Amount must be a positive number';
  }

  const description = (input.description ?? '').trim();
  if (description.length < 1) {
    issues.description = 'Description is required';
  } else if (description.length > MAX_DESCRIPTION_LENGTH) {
    issues.description = `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`;
  }

  if (!input.date || isNaN(Date.parse(input.date))) {
    issues.date = 'Valid date is required';
  }

  return issues;
}

/** True when no field-level rule is broken. */
export function isValidTransactionFields(input: TransactionFieldInput): boolean {
  const issues = validateTransactionFields(input);
  return !issues.amount && !issues.description && !issues.date;
}

/**
 * Normalises a typed amount so the create and edit screens accept exactly the
 * same characters (BUG-31): digits, at most one decimal separator, and at most
 * `MAX_AMOUNT_DECIMALS` decimals. A leading separator becomes `0.` so typing a
 * decimal first reads naturally instead of producing a lone `.`.
 */
export function sanitizeAmountInput(raw: string): string {
  const digitsAndDots = raw.replace(/[^0-9.]/g, '');
  const dot = digitsAndDots.indexOf('.');

  if (dot === -1) return stripLeadingZeros(digitsAndDots);

  const whole = stripLeadingZeros(digitsAndDots.slice(0, dot)) || '0';
  const decimals = digitsAndDots.slice(dot + 1).replace(/\./g, '').slice(0, MAX_AMOUNT_DECIMALS);
  return `${whole}.${decimals}`;
}

/** Parses a typed amount into the number the rules are checked against. */
export function parseAmountInput(raw: string): number {
  return raw.trim() === '' ? NaN : Number(raw);
}

function stripLeadingZeros(value: string): string {
  return value.replace(/^0+(?=\d)/, '');
}

/**
 * Account-link rules: which side each type must name, and which combinations the
 * write path refuses.
 *
 * BUG-41: extracted so the database guard and the read-only integrity scan call
 * the *same* predicates — a scan with its own copy of these lists would be free
 * to disagree with the rules it claims to check.
 */
const SOURCE_TYPES = new Set(['expense', 'transfer', 'loan_issue', 'loan_paidback', 'lend', 'repay']);
const DEST_TYPES = new Set(['income', 'transfer', 'loan_repayment', 'loan_received', 'lend', 'repay']);

export const SOURCE_ACCOUNT_REQUIRED = 'Source account is required';
export const DEST_ACCOUNT_REQUIRED = 'Destination account is required';

/** True when money must leave a named source account. */
export function requiresSourceAccount(type: string): boolean {
  return SOURCE_TYPES.has(type);
}

/** True when money must arrive in a named destination account. */
export function requiresDestAccount(type: string): boolean {
  return DEST_TYPES.has(type);
}

export interface TransactionLinkInput {
  type: string;
  sourceAccount?: string | null;
  destAccount?: string | null;
}

export interface TransactionLinkIssues {
  /** Present when the type must name a source account and none is set. */
  source?: string;
  /** Present when the type must name a destination account and none is set. */
  destination?: string;
  /** Present when one account sits on both sides of a type that forbids it. */
  pairing?: string;
}

/**
 * Message for a row naming the same account on both sides, else null. Mirrors the
 * guard's per-type wording verbatim. Both sides must be set: for every type that
 * reaches this check the guard has already required them, so a missing side is a
 * different (earlier) issue rather than a pairing one.
 */
export function sameAccountIssue(
  type: string,
  sourceAccount?: string | null,
  destAccount?: string | null,
): string | null {
  if (!sourceAccount || sourceAccount !== destAccount) return null;
  if (type === 'transfer') return 'Source and destination must differ';
  if (type === 'loan_issue') return 'Source and destination must differ for account-to-account loans';
  if (type === 'loan_repayment') return 'Repayment source and destination must differ';
  if (type === 'lend' || type === 'repay') return 'Source and destination must differ for lend/repay transactions';
  return null;
}

/** Pure shared half of the guard — presence and pairing only, no database lookups. */
export function validateTransactionLinks(input: TransactionLinkInput): TransactionLinkIssues {
  const issues: TransactionLinkIssues = {};
  if (requiresSourceAccount(input.type) && !input.sourceAccount) {
    issues.source = SOURCE_ACCOUNT_REQUIRED;
  }
  if (requiresDestAccount(input.type) && !input.destAccount) {
    issues.destination = DEST_ACCOUNT_REQUIRED;
  }
  const pairing = sameAccountIssue(input.type, input.sourceAccount, input.destAccount);
  if (pairing) issues.pairing = pairing;
  return issues;
}
