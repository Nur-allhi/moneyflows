import { describe, expect, it } from 'vitest';
import type { DeletedItem } from '../../../core/ports';
import { DELETED_KIND, RECYCLE_TABS, RECYCLE_TAB_LABEL, RECYCLE_TAB_TOTAL_LABEL } from '../recycleKinds';

/** Every kind the recycle bin can hold (see `DeletedItem['type']`). */
const ALL_KINDS: DeletedItem['type'][] = ['transaction', 'account', 'other_ledger', 'other_entry'];

describe('recycleKinds', () => {
  it('covers every deleted kind', () => {
    for (const kind of ALL_KINDS) expect(DELETED_KIND[kind]).toBeDefined();
  });

  it('gives every kind its own label, so the list cannot mislabel one as another (BUG-30)', () => {
    const labels = ALL_KINDS.map((k) => DELETED_KIND[k].label);
    expect(new Set(labels).size).toBe(labels.length);
    expect(DELETED_KIND.other_ledger.label).not.toBe(DELETED_KIND.account.label);
    expect(DELETED_KIND.other_entry.label).not.toBe(DELETED_KIND.account.label);
  });

  it('files every kind under a tab, and every tab is reachable by some kind', () => {
    const tabs = ALL_KINDS.map((k) => DELETED_KIND[k].tab);
    // Three real tabs, all of them used: no tab can be a dead end.
    expect([...new Set(tabs)].sort()).toEqual(['accounts', 'ledgers', 'transactions']);
  });

  it('keeps the other-ledger kinds out of the Accounts tab (BUG-30)', () => {
    expect(DELETED_KIND.other_ledger.tab).toBe('ledgers');
    expect(DELETED_KIND.other_entry.tab).toBe('ledgers');
    expect(DELETED_KIND.account.tab).toBe('accounts');
    expect(DELETED_KIND.transaction.tab).toBe('transactions');
  });

  it('labels every tab, and every tab that shows an amount says what that amount is', () => {
    for (const tab of RECYCLE_TABS) expect(RECYCLE_TAB_LABEL[tab]).toBeTruthy();
    for (const tab of RECYCLE_TABS) {
      if (tab === 'all') continue;
      expect(RECYCLE_TAB_TOTAL_LABEL[tab]).toBeTruthy();
    }
    // The 'all' tab mixes kinds by definition, so it has no single amount.
    expect('all' in RECYCLE_TAB_TOTAL_LABEL).toBe(false);
  });
});
