import { useEffect, useRef, useState } from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  percent: number;
  label?: string;
  sublabel?: string;
  className?: string;
}

export function ProgressBar({ percent, label, sublabel, className = '' }: ProgressBarProps) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  // Once visible, every percent change applies directly (T-165). The old code
  // disconnected the observer after its first trigger, freezing the bar.
  const visibleRef = useRef(false);

  useEffect(() => {
    if (visibleRef.current) {
      const id = requestAnimationFrame(() => setWidth(percent));
      return () => cancelAnimationFrame(id);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          visibleRef.current = true;
          requestAnimationFrame(() => setWidth(percent));
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [percent]);

  return (
    <div className={`${styles.section} ${className}`} ref={ref}>
      {(label || sublabel) && (
        <div className={styles.header}>
          {label && <span>{label}</span>}
          {sublabel && <span>{sublabel}</span>}
        </div>
      )}
      <div className={styles.track}>
        <div className={styles.fill} style={{ '--progress-width': `${width}%` } as React.CSSProperties} />
      </div>
    </div>
  );
}
