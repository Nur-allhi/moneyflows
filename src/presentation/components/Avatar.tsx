import type { CSSProperties } from 'react';
import styles from './Avatar.module.css';

type AvatarSize = 24 | 36 | 48 | 72;

interface AvatarProps {
  initial: string;
  name?: string;
  size: AvatarSize;
  active?: boolean;
  gradient?: string;
  className?: string;
  onClick?: () => void;
}

const memberGradients: Record<string, string> = {
  efty: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
  azam: 'linear-gradient(135deg, #00b894, #55efc4)',
  nahar: 'linear-gradient(135deg, #fd79a8, #e84393)',
};

const sizeClassMap: Record<AvatarSize, string> = {
  24: styles.size24 ?? '',
  36: styles.size36 ?? '',
  48: styles.size48 ?? '',
  72: styles.size72 ?? '',
};

export function Avatar({
  initial,
  name,
  size,
  active = false,
  gradient,
  className = '',
  onClick,
}: AvatarProps) {
  const resolvedGradient =
    gradient ?? (name ? memberGradients[name.toLowerCase()] : undefined) ?? memberGradients.efty;

  const classNames = [
    styles.avatar,
    sizeClassMap[size],
    active ? styles.active : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      style={{ background: resolvedGradient as CSSProperties['background'] }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={name ?? initial}
    >
      {initial.charAt(0).toUpperCase()}
    </div>
  );
}
