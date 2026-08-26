import type { LogEntry, LogLevel, LogCategory } from './types';
import { LOG_MAX_BYTES, LOG_MAX_ENTRIES, LOG_STORAGE_KEY } from './types';

function bucketAmount(n: number): string {
  if (n < 1000) return '<1k';
  if (n < 10000) return '1k-10k';
  if (n < 100000) return '10k-100k';
  return '100k+';
}

function redactData(data?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!data) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (k === 'amount' && typeof v === 'number') out[k] = bucketAmount(v);
    else if (k === 'description' && typeof v === 'string') out[k] = String(v).slice(0, 40);
    else out[k] = v;
  }
  return out;
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

class LoggerImpl {
  private entries: LogEntry[] = [];
  private verbose = false;
  private ready = false;

  constructor() {
    try {
      const raw = localStorage.getItem(LOG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LogEntry[];
        if (Array.isArray(parsed)) this.entries = parsed.slice(-LOG_MAX_ENTRIES);
      }
      const v = localStorage.getItem('moneyflows_logs_verbose');
      this.verbose = v === '1';
    } catch {
      // ignore
    }
    this.ready = true;
  }

  setVerbose(v: boolean) {
    this.verbose = v;
    try { localStorage.setItem('moneyflows_logs_verbose', v ? '1' : '0'); } catch { /* ignore */ }
  }

  getVerbose(): boolean { return this.verbose; }

  private persist(): void {
    try {
      // Cap by bytes: drop oldest until under 1MB
      let json = JSON.stringify(this.entries);
      while (json.length > LOG_MAX_BYTES && this.entries.length > 1) {
        this.entries.shift();
        json = JSON.stringify(this.entries);
      }
      localStorage.setItem(LOG_STORAGE_KEY, json);
    } catch {
      // quota — drop half
      try {
        this.entries = this.entries.slice(-Math.floor(LOG_MAX_ENTRIES / 2));
        localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.entries));
      } catch { /* give up */ }
    }
    // Best-effort OPFS mirror (non-blocking, never throws)
    void this.persistOpfs().catch(() => {});
  }

  private async persistOpfs(): Promise<void> {
    try {
      const root = await (navigator as unknown as { storage: { getDirectory: () => Promise<FileSystemDirectoryHandle> } }).storage.getDirectory();
      const dir = await root.getDirectoryHandle('logs', { create: true });
      const fh = await dir.getFileHandle('current.ndjson', { create: true });
      const writable = await (fh as unknown as { createWritable: () => Promise<FileSystemWritableFileStream> }).createWritable();
      const ndjson = this.entries.map((e) => JSON.stringify(e)).join('\n');
      await writable.write(ndjson);
      await writable.close();
    } catch {
      // OPFS not available — ignore
    }
  }

  private append(level: LogLevel, cat: LogCategory, msg: string, data?: Record<string, unknown>, stack?: string): void {
    if (level === 'debug' && !this.verbose) return;
    const entry: LogEntry = {
      id: uid(),
      ts: new Date().toISOString(),
      level,
      cat,
      msg,
      data: redactData(data),
      stack,
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
    };
    this.entries.push(entry);
    if (this.entries.length > LOG_MAX_ENTRIES) this.entries.shift();
    if (this.ready) this.persist();
  }

  debug(cat: LogCategory, msg: string, data?: Record<string, unknown>) { this.append('debug', cat, msg, data); }
  info(cat: LogCategory, msg: string, data?: Record<string, unknown>) { this.append('info', cat, msg, data); }
  warn(cat: LogCategory, msg: string, data?: Record<string, unknown>) { this.append('warn', cat, msg, data); }
  error(cat: LogCategory, msg: string, data?: Record<string, unknown>, stack?: string) { this.append('error', cat, msg, data, stack); }

  /** Activity log — user-facing, always info/activity */
  activity(msg: string, data?: Record<string, unknown>) { this.info('activity', msg, data); }

  getEntries(filter?: { level?: LogLevel; cat?: LogCategory; limit?: number }): LogEntry[] {
    let out = this.entries;
    if (filter?.cat) out = out.filter((e) => e.cat === filter.cat);
    if (filter?.level) {
      const order: LogLevel[] = ['debug', 'info', 'warn', 'error'];
      const idx = order.indexOf(filter.level);
      out = out.filter((e) => order.indexOf(e.level) >= idx);
    }
    if (filter?.limit) out = out.slice(-filter.limit);
    return [...out].reverse(); // newest first
  }

  clear(): void {
    this.entries = [];
    try { localStorage.removeItem(LOG_STORAGE_KEY); } catch { /* ignore */ }
    void this.persistOpfs().catch(() => {});
  }

  export(): string {
    return this.entries.map((e) => JSON.stringify(e)).join('\n');
  }

  dump(limit = 100): void {
    console.table(this.getEntries({ limit }).map((e) => ({ ts: e.ts, level: e.level, cat: e.cat, msg: e.msg, route: e.route })));
  }
}

export const logger = new LoggerImpl();

// Global backdoor for console: window.__logger
try {
  (window as unknown as Record<string, unknown>).__logger = logger;
} catch { /* ignore */ }
