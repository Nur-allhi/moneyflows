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

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
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
        <div className={styles.fill} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
