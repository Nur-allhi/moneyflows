# Backup & Data Safety — Implementation Plan

## Overview

Three-layer data protection for a browser-only SPA with localStorage persistence.

```
Layer 1: Ring Buffer (localStorage)   — quick rollback from mistakes
Layer 2: Integrity Hash (SHA-256)     — catch silent localStorage corruption
Layer 3: Silent Drive Export (FSA API) — physical/cloud safety via Google Drive
```

---

## Layer 1: Auto-backup Ring Buffer

### Location
`src/infrastructure/database/SQLiteDatabaseService.ts` — inside `save()`

### Storage Layout (localStorage)

| Key | Content |
|-----|---------|
| `moneyflows_db` | Live DB (current, unchanged) |
| `moneyflows_snap_0` | `{"data":"<base64>","time":"<ISO>","hash":"<sha256>"}` |
| `moneyflows_snap_1` | ... |
| ... | up to 9 |
| `moneyflows_snap_last_index` | `9` (configurable max) |

### Logic in `save()`
1. Check elapsed time since last snapshot (cooldown: 5 min default).
   - Track via in-memory `lastSnapshotTime: number`
   - On first call, always save a snapshot.
2. If cooldown elapsed:
   a. `db.export()` → binary → base64.
   b. Compute SHA-256 of the base64 string via `crypto.subtle.digest()`.
   c. Build snapshot object: `{ data, time: new Date().toISOString(), hash }`.
   d. Insert at slot 0: `localStorage.setItem('moneyflows_snap_0', JSON.stringify(snap))`.
   e. Shift existing slots: `moneyflows_snap_i → moneyflows_snap_{i+1}`.
   f. Delete the overflow slot (if `i == maxSlots`).
   g. Update `lastSnapshotTime`.

### Exposed via `IDatabaseService`
```ts
getSnapshots(): { time: string; hash: string }[];
restoreSnapshot(index: number): Promise<void>;  // verify hash → overwrite live DB → reload
```

### UI (Settings Modal)
- New section: **Restore Points**
- List of snapshots with timestamp, restore button per row
- On restore: confirm dialog → `restoreSnapshot(i)` → `location.reload()`

---

## Layer 2: Integrity Hash

### Where
SHA-256 hash is computed and stored inside each snapshot object (Layer 1).

### On restore
```ts
async restoreSnapshot(index: number): Promise<void> {
  const snap = JSON.parse(localStorage.getItem(`moneyflows_snap_${index}`));
  const computed = await sha256(snap.data);
  if (computed !== snap.hash) {
    // Skip corrupted slot, try previous one, or show error
    throw new Error('Snapshot corrupted — hash mismatch');
  }
  localStorage.setItem(STORAGE_KEY, snap.data);
}
```

### Hash helper
```ts
async function sha256(str: string): Promise<string> {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

Browser-native Web Crypto API — zero dependencies, works in all modern browsers.

---

## Layer 3: Silent Drive Folder Export (File System Access API)

### New File
`src/infrastructure/database/FolderSync.ts`

```ts
interface IFolderSync {
  setFolder(handle: FileSystemDirectoryHandle): Promise<void>;
  getFolder(): FileSystemDirectoryHandle | null;
  sync(db: Uint8Array): Promise<void>;    // write to folder
  load(): Promise<Uint8Array | null>;      // read from folder on boot
  hasPermission(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
}
```

### Storage
- Folder handle is serialized to IndexedDB (FileSystemDirectoryHandle is not serializable to localStorage)
- Key: `moneyflows_folder_handle`

### Sync logic (integrated into `save()`)
```ts
if (folderHandle && hasPermission()) {
  try {
    const appDir = await folderHandle.getDirectoryHandle('MoneyFlows', { create: true });
    // Write to .tmp first to avoid partial-file corruption
    const tmpFile = await appDir.getFileHandle('moneyflows.tmp', { create: true });
    const writable = await tmpFile.createWritable();
    await writable.write(dbBuffer);
    await writable.close();
    // Atomic rename (create new, delete old)
    await appDir.getFileHandle('moneyflows.db', { create: true }).then(async (f) => {
      const w = await f.createWritable();
      await w.write(dbBuffer);
      await w.close();
    });
    await appDir.removeEntry('moneyflows.tmp');
  } catch {
    // Silently fail — never block a save() for sync failure
  }
}
```

### Throttling
- Separate cooldown from ring buffer (e.g. 2 min)
- Drive desktop sync is not instant — writing every 5 min is sufficient

### UI (Settings Modal)
- **Backup to Drive** section
- Button: "Choose Google Drive folder" → opens native folder picker
- Status indicator: ✅ Syncing / ❌ Not set up / ⚠️ Permission needed
- Button: "Restore from Drive" → reads `moneyflows.db` from picked folder, overwrites live DB, reloads

---

## Implementation Order

| Step | What | Files changed | Effort |
|------|------|--------------|--------|
| 1 | Ring buffer + hash in `save()` | `SQLiteDatabaseService.ts` | ~30 lines |
| 2 | `getSnapshots()` / `restoreSnapshot()` on interface | `IDatabaseService.ts`, `SQLiteDatabaseService.ts` | ~20 lines |
| 3 | Restore Points UI in SettingsModal | `SettingsModal.tsx`, `SettingsModal.module.css` | ~40 lines |
| 4 | `FolderSync.ts` module | `FolderSync.ts` (new) | ~60 lines |
| 5 | Wire FolderSync into `save()` | `SQLiteDatabaseService.ts` | ~10 lines |
| 6 | Drive folder picker UI in SettingsModal | `SettingsModal.tsx`, `SettingsModal.module.css` | ~30 lines |

**Total: ~190 lines**

---

## Dependencies

None. All APIs are browser-native:
- `crypto.subtle.digest('SHA-256', ...)` — Web Crypto API
- `showDirectoryPicker()` — File System Access API
- `localStorage` — Web Storage API
- `indexedDB` — for serializing the folder handle

---

## Files to Create/Modify

### New
- `src/infrastructure/database/FolderSync.ts`

### Modify
- `src/core/ports/IDatabaseService.ts` — add snapshot methods
- `src/infrastructure/database/SQLiteDatabaseService.ts` — ring buffer logic + FolderSync integration
- `src/presentation/components/SettingsModal.tsx` — restore points UI + Drive folder picker
- `src/presentation/components/SettingsModal.module.css` — new section styles

---

## Edge Cases

| Case | Handling |
|------|----------|
| localStorage quota exceeded | Catch `QuotaExceededError`, delete oldest snapshot, retry |
| All snapshots corrupted | Show error in UI, offer manual export |
| Folder handle revoked (browser cleared data) | Show "Re-pick folder" prompt in Settings |
| Drive file write fails (disk full) | Silently fail — never block the app |
| Browser doesn't support FSA API (Firefox/Safari) | Hide Drive section in UI, show fallback text |
| Two devices write to same Drive file | Last-write-wins (acceptable for personal use) |
