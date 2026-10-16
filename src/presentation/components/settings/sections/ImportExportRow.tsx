import type { Cx } from './cx';

interface ImportExportRowProps {
  cx: Cx;
  onExport: () => void;
  onImport: () => void;
  importDisabled?: boolean;
}

/** Side-by-side export / import database buttons. */
export function ImportExportRow({ cx, onExport, onImport, importDisabled }: ImportExportRowProps) {
  return (
    <div className={cx.actionsRow}>
      <button className={cx.actionBtn} onClick={onExport}>↓ Export Database</button>
      <button className={cx.actionBtn} onClick={onImport} disabled={importDisabled}>↑ Import Database</button>
    </div>
  );
}
