import styles from './Avatar.module.css';

type AvatarSize = 24 | 36 | 48 | 72;

interface AvatarProps {
  initial: string;
  name?: string;
  seed?: string;
  size: AvatarSize;
  active?: boolean;
  gradient?: string;
  className?: string;
  onClick?: () => void;
}

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #6c5ce7, #a29bfe)';

const sizeClassMap: Record<AvatarSize, string> = {
  24: styles.size24 ?? '',
  36: styles.size36 ?? '',
  48: styles.size48 ?? '',
  72: styles.size72 ?? '',
};

const AVATAR_BASE = 'https://api.dicebear.com/9.x/lorelei/svg';

export function Avatar({
  initial,
  name,
  seed,
  size,
  active = false,
  gradient,
  className = '',
  onClick,
}: AvatarProps) {
  const resolvedGradient = gradient ?? DEFAULT_GRADIENT;

  const classNames = [
    styles.avatar,
    sizeClassMap[size],
    active ? styles.active : '',
    seed ? styles.imageAvatar : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const avatarUrl = seed ? `${AVATAR_BASE}?seed=${encodeURIComponent(seed)}` : undefined;

  return (
    <div
      className={classNames}
      style={{ '--avatar-bg': avatarUrl ? undefined : resolvedGradient } as React.CSSProperties}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={name ?? initial}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={name ?? initial} className={styles.avatarImg} />
      ) : (
        initial.charAt(0).toUpperCase()
      )}
    </div>
  );
}
