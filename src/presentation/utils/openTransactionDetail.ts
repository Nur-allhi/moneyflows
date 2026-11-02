import { getDatabase } from '../../infrastructure/database/getDatabase';
import { useModalStore } from '../stores/useModalStore';

/**
 * T-121: opens the transaction detail modal for a linked transaction from the
 * Other Ledger side of the cross-link. The row only stores the id, so the
 * transaction is fetched at click time (it may have been deleted in the
 * meantime — then this is a no-op instead of an error screen).
 */
export async function openTransactionDetail(txId: string): Promise<void> {
  if (!txId) return;
  try {
    const tx = await getDatabase().getTransactionById(txId);
    if (!tx) return;
    useModalStore.getState().open('transaction-detail', { transaction: tx });
  } catch {
    // Navigation is best-effort; the ledger entry itself is unaffected.
  }
}
