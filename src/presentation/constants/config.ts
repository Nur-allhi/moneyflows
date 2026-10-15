export const DEFAULT_DESCRIPTION_MAX_LENGTH = 200;
export const DESCRIPTION_MAX_LENGTH_MIN = 50;
export const DESCRIPTION_MAX_LENGTH_MAX = 500;

export const DEFAULT_NUMPAD_MAX_DIGITS = 10;
export const NUMPAD_MAX_DIGITS_MIN = 5;
export const NUMPAD_MAX_DIGITS_MAX = 15;

export const DEFAULT_DASHBOARD_TX_LIMIT = 15;
export const DASHBOARD_TX_LIMIT_MIN = 5;
export const DASHBOARD_TX_LIMIT_MAX = 50;

export const ANIMATION_DURATION = 600;

export const ROW_HEIGHT = 54;
export const DESKTOP_ROW_HEIGHT = 56;
export const OVERSCAN = 3;

export const STORAGE_KEY = 'moneyflows_db';
export const EXPORT_FILENAME_PREFIX = 'moneyflows_';

export const MAX_SNAPSHOTS = 10;
export const SNAPSHOT_COOLDOWN_MS = 300_000;
export const SNAPSHOT_PREFIX = 'moneyflows_snap_';
export const FOLDER_SYNC_COOLDOWN_MS = 120_000;
export const CLOUD_SYNC_COOLDOWN_MS = 120_000;
/** Cloud boot-pull budget — network must never trip the splash watchdog. */
export const CLOUD_BOOT_TIMEOUT_MS = 8_000;
