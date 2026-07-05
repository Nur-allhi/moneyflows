import { useEffect, useState, useRef } from 'react';
import styles from './SplashScreen.module.css';

interface SplashScreenProps {
  ready: boolean;
  onFinish: () => void;
}

const LINES = ['Money', 'Flows'];
const MIN_SPLASH_MS = 2000;
const CHAR_INTERVAL = 80;
const LINE_PAUSE = 400;
const START_DELAY = 300;
const FADE_DURATION = 500;

export function SplashScreen({ ready, onFinish }: SplashScreenProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const [fading, setFading] = useState(false);
  const startedAt = useRef(Date.now());
  const lineIdx = useRef(0);
  const charIdx = useRef(0);

  useEffect(() => {
    const td = setTimeout(() => {
      function type() {
        if (lineIdx.current >= LINES.length) {
          setDone(true);
          return;
        }
        const cl = LINES[lineIdx.current];
        if (charIdx.current < cl.length) {
          setDisplayed((prev) => prev + cl[charIdx.current]);
          charIdx.current++;
          setTimeout(type, CHAR_INTERVAL);
        } else {
          if (lineIdx.current < LINES.length - 1) {
            setDisplayed((prev) => prev + '\n');
            lineIdx.current++;
            charIdx.current = 0;
            setTimeout(type, LINE_PAUSE);
          } else {
            setDone(true);
          }
        }
      }
      type();
    }, START_DELAY);
    return () => clearTimeout(td);
  }, []);

  useEffect(() => {
    if (!done || !ready) return;
    const elapsed = Date.now() - startedAt.current;
    const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
    const id = setTimeout(() => setFading(true), remaining);
    return () => clearTimeout(id);
  }, [done, ready]);

  useEffect(() => {
    if (!fading) return;
    const id = setTimeout(onFinish, FADE_DURATION);
    return () => clearTimeout(id);
  }, [fading, onFinish]);

  return (
    <div className={`${styles.overlay} ${fading ? styles.fadeOut : ''}`}>
      <div className={styles.logo}>
        <span className={styles.text}>{displayed}</span>
        {!done && <span className={styles.cursor}>|</span>}
      </div>
    </div>
  );
}
