import { describe, it, expect } from 'vitest';
import { getStackDisplayName } from '../../domain/loanDisplay';

describe('getStackDisplayName', () => {
  it('suffixes the member for internal accounts', () => {
    expect(getStackDisplayName('Home EXP', 'cash', 'Md Iqbal azam')).toBe('Home EXP - Md Iqbal azam');
  });

  it('uses the plain name for counterparty debtors even with a member', () => {
    expect(getStackDisplayName('Azam', 'counterparty', 'Somebody')).toBe('Azam');
  });

  it('uses the plain name when the member is unknown', () => {
    expect(getStackDisplayName('Brac Bank', 'bank', undefined)).toBe('Brac Bank');
  });
});
