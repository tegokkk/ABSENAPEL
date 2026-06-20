import clsx from 'clsx';

const badgeMap = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger:  'badge-danger',
  info:    'badge-info',
  neutral: 'badge-neutral',
};

export default function Badge({ variant = 'neutral', className, children }) {
  return (
    <span className={clsx('badge', badgeMap[variant] ?? 'badge-neutral', className)}>
      {children}
    </span>
  );
}
