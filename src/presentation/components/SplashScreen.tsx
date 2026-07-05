import { useEffect, useState, useRef } from 'react';
import styles from './SplashScreen.module.css';

interface SplashScreenProps {
  ready: boolean;
  onFinish: () => void;
}

const LINES = ['Money', 'Flows'];
const TEXT = LINES.join('\n');
const MIN_SPLASH_MS = 2000;
const CHAR_INTERVAL = 80;
const LINE_PAUSE = 400;
const START_DELAY = 300;
const FADE_DURATION = 500;

export function SplashScreen({ ready, onFinish }: SplashScreenProps) {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    startedAt.current = Date.now();
    const tids: ReturnType<typeof setTimeout>[] = [];
    let acc = 0;

    for (let i = 0; i < TEXT.length; i++) {
      const delay = i === 0 ? START_DELAY : TEXT[i - 1] === '\n' ? LINE_PAUSE : CHAR_INTERVAL;
      acc += delay;
      const j = i + 1;
      tids.push(setTimeout(() => setIdx(j), acc));
    }

    return () => tids.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (idx < TEXT.length || !ready) return;
    const elapsed = Date.now() - startedAt.current;
    const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
    const t = setTimeout(() => setFading(true), remaining);
    return () => clearTimeout(t);
  }, [idx, ready]);

  useEffect(() => {
    if (!fading) return;
    const id = setTimeout(onFinish, FADE_DURATION);
    return () => clearTimeout(id);
  }, [fading, onFinish]);

  return (
    <div className={`${styles.overlay} ${fading ? styles.fadeOut : ''}`}>
      <div className={styles.logo}>
        <span className={styles.text}>{TEXT.slice(0, idx)}</span>
        {idx < TEXT.length && <span className={styles.cursor}>|</span>}
      </div>
    </div>
  );
}
