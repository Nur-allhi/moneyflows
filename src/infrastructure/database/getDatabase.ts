import { SQLiteDatabaseService } from './SQLiteDatabaseService';
import type { IDatabaseService, BootProgress } from '../../core/ports/IDatabaseService';

let instance: IDatabaseService | null = null;
let initPromise: Promise<IDatabaseService> | null = null;

/**
 * Concurrent callers (React StrictMode double-mount, multiple screens) share the
 * same init promise, so nobody touches the service before boot completed.
 */
export function initDatabase(progress?: BootProgress): Promise<IDatabaseService> {
  if (!initPromise) {
    const db = new SQLiteDatabaseService();
    // Register before awaiting init so recovery UI can call
    // restoreNewestSnapshot()/resetStorage() even when boot fails.
    instance = db;
    initPromise = db.init(progress)
      .then(() => db)
      .catch((e: unknown) => {
        initPromise = null;
        instance = null;
        throw e;
      });
  }
  return initPromise;
}

export function getDatabase(): IDatabaseService {
  if (!instance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return instance;
}
