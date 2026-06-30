import type { ReactNode } from 'react';
import styles from './GlassPanel.module.css';

type GlowVariant = 'violet' | 'gold' | 'purple';
type PaddingSize = 'none' | 'sm' | 'md' | 'lg';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  glow?: GlowVariant;
  hover?: boolean;
  padding?: PaddingSize;
  as?: 'div' | 'section' | 'article' | 'aside';
}

const glowClassMap: Record<GlowVariant, string> = {
  violet: styles.glowViolet ?? '',
  gold: styles.glowGold ?? '',
  purple: styles.glowPurple ?? '',
};

const paddingClassMap: Record<PaddingSize, string> = {
  none: '',
  sm: styles.padSm ?? '',
  md: styles.padMd ?? '',
  lg: styles.padLg ?? '',
};

export function GlassPanel({
  children,
  className = '',
  glow,
  hover = true,
  padding = 'md',
  as: Tag = 'div',
}: GlassPanelProps) {
  const classNames = [
    styles.panel,
    hover ? styles.hover : '',
    glow ? glowClassMap[glow] : '',
    paddingClassMap[padding],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <Tag className={classNames}>{children}</Tag>;
}
