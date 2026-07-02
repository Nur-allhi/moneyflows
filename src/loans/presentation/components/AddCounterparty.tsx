import { useState } from 'react';
import { useLoanStore } from '../stores/useLoanStore';
import styles from './AddCounterparty.module.css';

interface AddCounterpartyProps {
  onCreated: (accountId: string) => void;
  onCancel: () => void;
}

export function AddCounterparty({ onCreated, onCancel }: AddCounterpartyProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const { createCounterparty } = useLoanStore();

  const handleSave = async () => {
    if (!name.trim()) { setErr('Name is required'); return; }
    setSaving(true);
    setErr('');
    try {
      const result = await createCounterparty(name.trim());
      onCreated(result.accountId);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Counterparty Name</span>
        <input
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          autoFocus
        />
      </div>
      {err && <span className={styles.error}>{err}</span>}
      <div className={styles.actions}>
        <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
        <button className={styles.submitBtn} onClick={handleSave} disabled={saving || !name.trim()}>
          {saving ? 'Creating...' : 'Create Counterparty'}
        </button>
      </div>
    </div>
  );
}
