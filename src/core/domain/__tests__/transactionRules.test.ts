import { describe, it, expect } from 'vitest';
import {
  MAX_DESCRIPTION_LENGTH,
  isValidTransactionFields,
  parseAmountInput,
  sanitizeAmountInput,
  validateTransactionFields,
} from '../transactionRules';

const valid = { amount: 1000, description: 'Groceries', date: '2026-10-17' };

describe('validateTransactionFields (BUG-24)', () => {
  it('accepts a well-formed transaction', () => {
    expect(validateTransactionFields(valid)).toEqual({});
    expect(isValidTransactionFields(valid)).toBe(true);
  });

  // The exact set the edit path used to let through: clearing the amount box
  // saved 0, typing letters saved NaN, and both were written into
  // `accounts.balance` by applyBalanceChange.
  it.each([
    ['zero', 0],
    ['NaN (e.g. a cleared or non-numeric box)', NaN],
    ['negative', -500],
    ['Infinity', Infinity],
  ])('rejects a %s amount', (_label, amount) => {
    expect(validateTransactionFields({ ...valid, amount }).amount).toBe('Amount must be a positive number');
    expect(isValidTransactionFields({ ...valid, amount })).toBe(false);
  });

  it('rejects an empty or whitespace-only description', () => {
    expect(validateTransactionFields({ ...valid, description: '' }).description).toBe('Description is required');
    expect(validateTransactionFields({ ...valid, description: '   ' }).description).toBe('Description is required');
  });

  it(`allows exactly ${MAX_DESCRIPTION_LENGTH} characters and rejects more`, () => {
    expect(validateTransactionFields({ ...valid, description: 'x'.repeat(MAX_DESCRIPTION_LENGTH) }).description).toBeUndefined();
    expect(validateTransactionFields({ ...valid, description: 'x'.repeat(MAX_DESCRIPTION_LENGTH + 1) }).description)
      .toBe(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`);
  });

  it('rejects an unparseable or missing date', () => {
    expect(validateTransactionFields({ ...valid, date: 'not-a-date' }).date).toBe('Valid date is required');
    expect(validateTransactionFields({ ...valid, date: '' }).date).toBe('Valid date is required');
  });

  it('reports every broken field at once, not just the first', () => {
    const issues = validateTransactionFields({ amount: 0, description: '', date: 'nope' });
    expect(issues).toEqual({
      amount: 'Amount must be a positive number',
      description: 'Description is required',
      date: 'Valid date is required',
    });
  });

  it('accepts a fractional amount (the DB stores any positive finite number)', () => {
    expect(validateTransactionFields({ ...valid, amount: 100.5 })).toEqual({});
  });
});

describe('sanitizeAmountInput (BUG-31)', () => {
  it('drops characters that cannot appear in an amount', () => {
    expect(sanitizeAmountInput('1a2b3')).toBe('123');
    expect(sanitizeAmountInput('-500')).toBe('500');
    expect(sanitizeAmountInput('1,000')).toBe('1000');
    expect(sanitizeAmountInput('abc')).toBe('');
  });

  it('allows a single decimal separator and keeps at most two decimals', () => {
    expect(sanitizeAmountInput('100.50')).toBe('100.50');
    expect(sanitizeAmountInput('100.505')).toBe('100.50');
    expect(sanitizeAmountInput('1.2.3')).toBe('1.23');
  });

  it('turns a leading separator into 0. so typing a decimal reads naturally', () => {
    expect(sanitizeAmountInput('.')).toBe('0.');
    expect(sanitizeAmountInput('.5')).toBe('0.5');
  });

  it('strips leading zeros but keeps a lone zero', () => {
    expect(sanitizeAmountInput('007')).toBe('7');
    expect(sanitizeAmountInput('0')).toBe('0');
    expect(sanitizeAmountInput('0.50')).toBe('0.50');
  });

  it('keeps a trailing separator so the user can keep typing', () => {
    expect(sanitizeAmountInput('12.')).toBe('12.');
  });
});

describe('parseAmountInput', () => {
  it('treats an empty or whitespace-only box as no amount', () => {
    expect(parseAmountInput('')).toBeNaN();
    expect(parseAmountInput('   ')).toBeNaN();
  });

  it('parses decimals, unlike the old parseInt path that truncated them', () => {
    expect(parseAmountInput('100.50')).toBe(100.5);
  });
});
