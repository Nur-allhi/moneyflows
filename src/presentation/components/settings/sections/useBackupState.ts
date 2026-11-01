import { useState, useCallback } from 'react';
import { getDatabase } from '../../../../infrastructure/database/getDatabase';
import { folderSync } from '../../../../infrastructure/database/FolderSync';
import type { SnapshotInfo, StorageHealth } from '../../../../core/ports/IDatabaseService';
import type { IntegrityReport } from '../../../../core/domain/transactionIntegrity';
import { useSettingsStore } from '../../../stores/useSettingsStore';

export interface BackupFile {
  name: string;
  lastModified: number;
}

/**
 * Shared backup/restore state for SettingsPage + SettingsModal.
 * Unifies the identical snapshot/folder/restore logic previously
 * duplicated in both hosts — behavior preserved verbatim.
 */
export function useBackupState() {
  const locale = useSettingsStore((s) => s.settings.locale);
  const [snapshots, setSnapshots] = useState<SnapshotInfo[]>([]);
  const [storageHealth, setStorageHealth] = useState<StorageHealth | null>(null);
  const [integrity, setIntegrity] = useState<IntegrityReport | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [fsPermission, setFsPermission] = useState<boolean | null>(null);
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([]);
  const [restoringFile, setRestoringFile] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setSnapshots(await getDatabase().getSnapshots());
    setStorageHealth(getDatabase().getStorageHealth());
    try {
      // BUG-41: read-only scan of stored transactions. Caught on purpose — a
      // failed scan must never stop the rest of the backup card from loading.
      setIntegrity(await getDatabase().findInvalidTransactions());
    } catch {
      setIntegrity(null);
    }
    const handle = await folderSync.getFolderHandle();
    if (handle) {
      setFolderName(handle.name);
      const ok = await folderSync.hasPermission();
      setFsPermission(ok);
      if (ok) setBackupFiles(await folderSync.listFiles());
    } else {
      setFolderName(null);
      setFsPermission(null);
      setBackupFiles([]);
    }
  }, []);

  const formatSnapshotTime = useCallback((iso: string): string => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: true } as const);
    if (isToday) return `Today ${time}`;
    const date = d.toLocaleDateString(locale, { month: 'short', day: 'numeric' } as const);
    return `${date} ${time}`;
  }, [locale]);

  const handleRestore = useCallback(async (index: number, time: string) => {
    if (!window.confirm(`Replace all current data with the snapshot from ${time}?`)) return;
    setRestoring(true);
    setRestoreError(null);
    try {
      await getDatabase().restoreSnapshot(index);
      window.location.reload();
    } catch (e) {
      setRestoreError(e instanceof Error ? e.message : 'Restore failed');
      setRestoring(false);
    }
  }, []);

  const handlePickFolder = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handle = await (window as any).showDirectoryPicker();
      await folderSync.setFolder(handle);
      setFolderName(handle.name);
      setFsPermission(true);
      setBackupFiles(await folderSync.listFiles());
    } catch { /* user cancelled */ }
  }, []);

  const handleReauthorize = useCallback(async () => {
    const ok = await folderSync.requestPermission();
    setFsPermission(ok);
    if (ok) setBackupFiles(await folderSync.listFiles());
  }, []);

  const handleStopBackup = useCallback(async () => {
    await folderSync.clearHandle();
    setFolderName(null);
    setFsPermission(null);
  }, []);

  const handleRestoreFile = useCallback(async (name: string) => {
    const ts = name.replace('moneyflows-', '').replace('.db', '');
    const y = ts.slice(0, 4), M = ts.slice(4, 6), d = ts.slice(6, 8);
    const h = ts.slice(9, 11), m = ts.slice(11, 13), s = ts.slice(13, 15);
    const label = `${y}-${M}-${d} ${h}:${m}:${s}`;
    if (!window.confirm(`Replace all current data with the backup from ${label}?`)) return;
    setRestoringFile(name);
    setRestoreError(null);
    try {
      const data = await folderSync.loadFile(name);
      if (!data) throw new Error('Failed to read backup file');
      const db = getDatabase();
      await db.importFromBytes(data);
      window.location.reload();
    } catch (e) {
      setRestoreError(e instanceof Error ? e.message : 'Restore failed');
      setRestoringFile(null);
    }
  }, []);

  const handleExportDb = useCallback(() => {
    getDatabase().exportToFile();
  }, []);

  return {
    snapshots,
    storageHealth,
    integrity,
    restoreError,
    setRestoreError,
    restoring,
    folderName,
    fsPermission,
    backupFiles,
    restoringFile,
    refresh,
    formatSnapshotTime,
    handleRestore,
    handlePickFolder,
    handleReauthorize,
    handleStopBackup,
    handleRestoreFile,
    handleExportDb,
  };
}

export type BackupState = ReturnType<typeof useBackupState>;
