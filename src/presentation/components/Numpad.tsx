import { useCallback } from 'react';
import styles from './Numpad.module.css';

interface NumpadProps {
  onInput: (digit: string) => void;
  onBackspace: () => void;
  className?: string;
}

const keys = [
  '1', '2', '3',
  '4', '5', '6',
  '7', '8', '9',
  '', '0', 'backspace',
];

export function Numpad({ onInput, onBackspace, className = '' }: NumpadProps) {
  const handleKey = useCallback((key: string) => {
    if (key === 'backspace') {
      onBackspace();
    } else if (key) {
      onInput(key);
    }
  }, [onInput, onBackspace]);

  return (
    <div className={`${styles.numpad} ${className}`}>
      {keys.map((key) => {
        if (key === 'backspace') {
          return (
            <button
              key={key}
              className={`${styles.key} ${styles.action}`}
              onClick={() => handleKey(key)}
              aria-label="Backspace"
              type="button"
            >
              {'\u232B'}
            </button>
          );
        }
        if (!key) {
          return <div key="blank" className={`${styles.key} ${styles.blank}`} />;
        }
        return (
          <button
            key={key}
            className={styles.key}
            onClick={() => handleKey(key)}
            type="button"
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}
