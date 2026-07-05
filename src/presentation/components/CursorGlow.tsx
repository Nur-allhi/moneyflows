import { useEffect, useState } from 'react';
import styles from './CursorGlow.module.css';

export function CursorGlow() {
  const [pos, setPos] = useState({ x: -999, y: -999 });
  const [pos2, setPos2] = useState({ x: -999, y: -999 });

  useEffect(() => {
    let rafId: number;
    let current = { x: -999, y: -999 };
    let target = { x: -999, y: -999 };

    const onMouse = (e: MouseEvent) => {
      target = { x: e.clientX, y: e.clientY };
      setPos(target);
    };

    const animate = () => {
      current = {
        x: current.x + (target.x - current.x) * 0.04,
        y: current.y + (target.y - current.y) * 0.04,
      };
      setPos2(current);
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouse, { passive: true });
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouse);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className={styles.container}>
      <div
        className={styles.glow1}
        style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
      />
      <div
        className={styles.glow2}
        style={{ transform: `translate3d(${pos2.x}px, ${pos2.y}px, 0)` }}
      />
    </div>
  );
}
