import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import styles from './PageTransition.module.css';

interface PageTransitionProps {
  children: ReactNode;
  excludePaths?: string[];
}

export function PageTransition({ children, excludePaths }: PageTransitionProps) {
  const location = useLocation();
  const excluded = excludePaths?.includes(location.pathname);

  if (excluded) return <>{children}</>;

  return (
    <div key={location.pathname} className={styles.page}>
      {children}
    </div>
  );
}
