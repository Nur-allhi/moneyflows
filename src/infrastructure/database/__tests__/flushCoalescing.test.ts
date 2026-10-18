import { describe, expect, it, vi } from 'vitest';
import { SQLiteDatabaseService } from '../SQLiteDatabaseService';

/**
 * BUG-46: persistence is coalesced through a dirty flag plus a single scheduled
 * write. The scheduling flag used to be set and never cleared, so after the first
 * scheduled flush of a page load every later `markDirty()` was a no-op — a loan
 * edit landed in memory and was gone after reload. These tests pin the coalescing
 * contract: one write per burst, and always a new one for a later change.
 */
type FlushInternals = {
  db: { export: () => Uint8Array };
  storage: {
    writeMain: (data: Uint8Array) => Promise<void>;
    readSnapshot: () => Promise<null>;
    writeSnapshot: () => Promise<void>;
    deleteSnapshot: () => Promise<void>;
    usageEstimate: () => Promise<null>;
  };
  dirty: boolean;
  lastFlushAt: number;
  markDirty: () => void;
  flush: () => Promise<void>;
};

function makeService(): { service: FlushInternals; writeMain: ReturnType<typeof vi.fn> } {
  const writeMain = vi.fn(async () => undefined);
  const service = Object.create(SQLiteDatabaseService.prototype) as unknown as FlushInternals;
  service.db = { export: () => new Uint8Array([1, 2, 3]) };
  service.storage = {
    writeMain, readSnapshot: async () => null, writeSnapshot: async () => undefined,
    deleteSnapshot: async () => undefined, usageEstimate: async () => null,
  };
  service.dirty = false;
  service.lastFlushAt = Date.now();
  return { service, writeMain };
}

/** Let the scheduled microtask (and the flush it starts) finish. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 5));

describe('flush coalescing (BUG-46)', () => {
  it('writes again for a change made after an earlier flush', async () => {
    const { service, writeMain } = makeService();

    service.markDirty();
    await settle();
    expect(writeMain).toHaveBeenCalledTimes(1);

    // The change a raw writer announced after that flush (a loan edit) must not
    // be dropped just because one write already happened in this page load.
    service.markDirty();
    await settle();
    expect(writeMain).toHaveBeenCalledTimes(2);
    expect(service.dirty).toBe(false);
  });

  it('coalesces a burst of changes into one write', async () => {
    const { service, writeMain } = makeService();

    service.markDirty();
    service.markDirty();
    service.markDirty();
    await settle();

    expect(writeMain).toHaveBeenCalledTimes(1);
  });

  it('keeps flushing for repeated writes', async () => {
    const { service, writeMain } = makeService();

    for (let i = 0; i < 3; i++) {
      service.markDirty();
      await settle();
    }

    expect(writeMain).toHaveBeenCalledTimes(3);
  });
});
