import clsx from 'clsx';

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

export default function Avatar({ src, name, size = 'md', className }) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={clsx(
          'rounded-full object-cover shadow-sm',
          sizes[size],
          className,
        )}
        style={{ border: '2px solid var(--border)' }}
      />
    );
  }

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-bold shadow-sm',
        sizes[size],
        className,
      )}
      style={{
        background: 'rgba(16,185,129,0.15)',
        color: '#34d399',
        border: '1px solid rgba(16,185,129,0.25)',
      }}
    >
      {initials}
    </div>
  );
}
