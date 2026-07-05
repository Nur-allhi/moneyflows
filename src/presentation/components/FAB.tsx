import { useModalStore } from '../stores/useModalStore';
import styles from './FAB.module.css';

export function FAB() {
  return (
    <button className={styles.fab} onClick={() => useModalStore.getState().open('transaction-form')} aria-label="New transaction">
      <span className={styles.icon}>+</span>
    </button>
  );
}
