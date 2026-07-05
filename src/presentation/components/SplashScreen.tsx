import { useEffect, useState, useRef } from 'react';
import styles from './SplashScreen.module.css';

interface SplashScreenProps {
  ready: boolean;
  onFinish: () => void;
}

const FULL_TEXT = 'MoneyFlows';
const MIN_SPLASH_MS = 2000;
const TYPING_INTERVAL = 120;

export function SplashScreen({ ready, onFinish }: SplashScreenProps) {
  const [charCount, setCharCount] = useState(1);
  const [fading, setFading] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (charCount >= FULL_TEXT.length) return;
    const id = setTimeout(() => setCharCount((c) => c + 1), TYPING_INTERVAL);
    return () => clearTimeout(id);
  }, [charCount]);

  useEffect(() => {
    if (!ready || charCount < FULL_TEXT.length) return;
    const elapsed = Date.now() - startedAt.current;
    const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
    const id = setTimeout(() => setFading(true), remaining);
    return () => clearTimeout(id);
  }, [ready, charCount]);

  useEffect(() => {
    if (!fading) return;
    const id = setTimeout(onFinish, 500);
    return () => clearTimeout(id);
  }, [fading, onFinish]);

  const typed = FULL_TEXT.slice(0, charCount);
  const base = typed.slice(0, 5);
  const accent = typed.slice(5);

  return (
    <div className={`${styles.overlay} ${fading ? styles.fadeOut : ''}`}>
      <div className={styles.logo}>
        <span className={styles.logoBase}>{base}</span>
        <span className={styles.logoAccent}>{accent}</span>
        {charCount < FULL_TEXT.length && <span className={styles.cursor} />}
      </div>
      {charCount >= FULL_TEXT.length && <div className={styles.spinner} />}
    </div>
  );
}
