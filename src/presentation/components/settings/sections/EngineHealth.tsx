import type { StorageHealth } from '../../../../core/ports/IDatabaseService';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import type { Cx } from './cx';

interface EngineHealthProps {
  cx: Cx;
  storageHealth: StorageHealth | null;
}

/** OPFS / browser-storage engine status row. */
export function EngineHealth({ cx, storageHealth }: EngineHealthProps) {
  const locale = useSettingsStore((s) => s.settings.locale);

  if (!storageHealth) return null;

  return (
    <div className={cx.statusRow}>
      <span className={storageHealth.lastFlushFailed ? cx.statusWarnDot : cx.statusDot} />
      <span className={cx.statusText}>
        {storageHealth.backend === 'opfs' ? 'OPFS (fast local file)' : 'Browser storage'}
        {' — '}
        {storageHealth.lastFlushFailed
          ? 'last save failed; check disk space'
          : storageHealth.lastFlushAt
            ? `saved ${new Date(storageHealth.lastFlushAt).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: true } as const)}`
            : 'ready'}
      </span>
    </div>
  );
}
