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
