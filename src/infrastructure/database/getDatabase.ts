import { SQLiteDatabaseService } from './SQLiteDatabaseService';
import type { IDatabaseService } from '../../core/ports/IDatabaseService';

let instance: IDatabaseService | null = null;

export async function initDatabase(): Promise<IDatabaseService> {
  if (!instance) {
    const db = new SQLiteDatabaseService();
    // Register before awaiting init so recovery UI can call
    // restoreNewestSnapshot()/resetStorage() even when boot fails.
    instance = db;
    await db.init();
  }
  return instance;
}

export function getDatabase(): IDatabaseService {
  if (!instance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return instance;
}
