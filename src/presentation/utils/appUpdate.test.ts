import { describe, it, expect } from 'vitest';
import { isUpdateTakeover } from './appUpdate';

describe('isUpdateTakeover (update banner)', () => {
  it('a page that started WITH a controller sees any takeover as an update', () => {
    expect(isUpdateTakeover({ startedWithController: true, controllerChanges: 1 })).toBe(true);
  });

  it('a page with NO controller: the first change is the initial claim, not an update', () => {
    expect(isUpdateTakeover({ startedWithController: false, controllerChanges: 1 })).toBe(false);
  });

  it('a page with NO controller: the second change is a real update', () => {
    expect(isUpdateTakeover({ startedWithController: false, controllerChanges: 2 })).toBe(true);
  });

  it('no change is never an update', () => {
    expect(isUpdateTakeover({ startedWithController: true, controllerChanges: 0 })).toBe(false);
    expect(isUpdateTakeover({ startedWithController: false, controllerChanges: 0 })).toBe(false);
  });
});
