import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import styles from './SplashScreen.module.css';

interface SplashScreenProps {
  ready: boolean;
  onFinish: () => void;
}

const TEXT = 'MoneyFlows';
const CHAR_INTERVAL = 40;
const POST_TYPING_DELAY = 300;
const FADE_DURATION = 500;

export function SplashScreen({ ready, onFinish }: SplashScreenProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const [fading, setFading] = useState(false);
  const idx = useRef(0);

  useLayoutEffect(() => {
    setDisplayed(TEXT.charAt(0));
    idx.current = 1;
    const td = setTimeout(function type() {
      if (idx.current < TEXT.length) {
        setDisplayed(TEXT.slice(0, idx.current + 1));
        idx.current++;
        setTimeout(type, CHAR_INTERVAL);
      } else {
        setDone(true);
      }
    }, CHAR_INTERVAL);
    return () => clearTimeout(td);
  }, []);

  useEffect(() => {
    if (!done || !ready) return;
    const id = setTimeout(() => setFading(true), POST_TYPING_DELAY);
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
        <span className={styles.wordmark}>
          {displayed.length <= 5 ? (
            <span className={styles.base}>{displayed}</span>
          ) : (
            <>
              <span className={styles.base}>Money</span>
              <span className={styles.accent}>{displayed.slice(5)}</span>
            </>
          )}
        </span>
        {!done && <span className={styles.cursor} />}
      </div>
    </div>
  );
}
