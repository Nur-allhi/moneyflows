import { useCallback, useEffect, useState } from 'react';
import styles from './RippleGlow.module.css';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function RippleGlow() {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = useCallback((e: MouseEvent) => {
    const ripple = { id: Date.now() + Math.random(), x: e.clientX, y: e.clientY };
    setRipples(prev => [...prev, ripple]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== ripple.id)), 850);
  }, []);

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [handleClick]);

  return (
    <div className={styles.container}>
      {ripples.map(r => (
        <div key={r.id} className={styles.ripple} style={{ left: r.x, top: r.y }}>
          <div className={styles.splash} />
          <div className={styles.dot} />
          <div className={styles.ring} />
          <div className={styles.ring2} />
        </div>
      ))}
    </div>
  );
}
