export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory = 'app' | 'nav' | 'store' | 'db' | 'storage' | 'ui' | 'pwa' | 'activity';

export interface LogEntry {
  id: string;
  ts: string; // ISO
  level: LogLevel;
  cat: LogCategory;
  msg: string;
  data?: Record<string, unknown>;
  stack?: string;
  route?: string;
}

export const LOG_STORAGE_KEY = 'moneyflows_logs_v1';
export const LOG_MAX_ENTRIES = 1000;
export const LOG_MAX_BYTES = 1024 * 1024; // 1MB
