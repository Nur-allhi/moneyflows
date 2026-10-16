import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import styles from './SplashScreen.module.css';
import { APP_VERSION } from '../constants/appVersion';
import { ProgressBar } from './ProgressBar';

interface SplashScreenProps {
  ready: boolean;
  onFinish: () => void;
  /** Boot progress 0..100 (T-161). */
  percent?: number;
  /** Plain-language boot stage (T-161). */
  status?: string;
}

const TEXT = 'MoneyFlows';
const CHAR_INTERVAL = 40;
const POST_TYPING_DELAY = 300;
const FADE_DURATION = 500;

export function SplashScreen({ ready, onFinish, percent = 0, status = '' }: SplashScreenProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const [fading, setFading] = useState(false);
  /**
   * Boot narration appears only when boot actually takes time (T-168): fast
   * boots never flash a loader, slow boots narrate every stage.
   */
  const [showProgress, setShowProgress] = useState(false);
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
    if (ready) return;
    const id = setTimeout(() => setShowProgress(true), 600);
    return () => clearTimeout(id);
  }, [ready]);

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
      <span className={styles.version}>v{APP_VERSION}</span>
      {showProgress && (
        <div className={styles.bootProgress}>
          <ProgressBar percent={ready ? 100 : percent} sublabel={ready ? 'Ready' : status} />
        </div>
      )}
    </div>
  );
}
