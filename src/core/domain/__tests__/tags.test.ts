import { describe, expect, it } from 'vitest';
import { transactionTags } from '../tags';

describe('transactionTags', () => {
  it('returns an empty list when metadata or tags are missing', () => {
    expect(transactionTags({})).toEqual([]);
    expect(transactionTags({ metadata: {} })).toEqual([]);
  });

  it('reads a single tag written by the wizard', () => {
    expect(transactionTags({ metadata: { tags: ['groceries'] } })).toEqual(['groceries']);
  });

  it('keeps every tag of a multi-tag record in order', () => {
    expect(transactionTags({ metadata: { tags: ['food', 'family', 'july'] } })).toEqual(['food', 'family', 'july']);
  });

  it('ignores malformed and blank values, and trims whitespace', () => {
    expect(transactionTags({ metadata: { tags: ['  bills  ', '', '   ', 42, null, undefined, 'rent'] } })).toEqual(['bills', 'rent']);
  });

  it('returns an empty list when tags is not an array', () => {
    expect(transactionTags({ metadata: { tags: 'groceries' } })).toEqual([]);
    expect(transactionTags({ metadata: { tags: { name: 'groceries' } } })).toEqual([]);
  });
});
