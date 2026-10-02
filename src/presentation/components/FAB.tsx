import { useModalStore } from '../stores/useModalStore';
import { useReplay } from '../hooks/useReplay';
import styles from './FAB.module.css';

export function FAB() {
  const [fabKey, replayFab] = useReplay();
  return (
    <button className={`${styles.fab} ${fabKey > 0 ? 'anim-twist' : ''}`} onClick={() => { replayFab(); useModalStore.getState().open('transaction-form'); }} aria-label="New transaction">
      <span className={`${styles.icon} anim-target`} key={fabKey}>+</span>
    </button>
  );
}
