import { SQLiteDatabaseService } from './SQLiteDatabaseService';
import type { IDatabaseService } from '../../core/ports/IDatabaseService';

let instance: IDatabaseService | null = null;

export async function initDatabase(): Promise<IDatabaseService> {
  if (!instance) {
    const db = new SQLiteDatabaseService();
    await db.init();
    instance = db;
  }
  return instance;
}

export function getDatabase(): IDatabaseService {
  if (!instance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return instance;
}
