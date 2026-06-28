import { forwardRef } from 'react';
import clsx from 'clsx';

const variants = {
  primary:
    'bg-accent-500 text-white hover:bg-accent-600 shadow-sm shadow-accent-500/20 active:scale-[.97]',
  secondary:
    'bg-transparent text-[--text-secondary] border border-[--border] hover:border-[rgba(255,255,255,0.15)] hover:text-[--text-primary] hover:bg-[rgba(255,255,255,0.05)] active:scale-[.97]',
  success:
    'bg-accent-500 text-white hover:bg-accent-600 active:scale-[.97]',
  danger:
    'bg-[rgba(239,68,68,0.12)] text-[#f87171] border border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.2)] active:scale-[.97]',
  ghost:
    'text-[--text-secondary] hover:bg-[rgba(255,255,255,0.06)] hover:text-[--text-primary] active:scale-[.97]',
  warning:
    'bg-[rgba(245,158,11,0.12)] text-[#fbbf24] border border-[rgba(245,158,11,0.2)] hover:bg-[rgba(245,158,11,0.2)] active:scale-[.97]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

const Button = forwardRef(
  ({ variant = 'primary', size = 'md', loading, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex min-w-0 items-center justify-center gap-2 rounded-lg font-semibold leading-none transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] [&>svg]:shrink-0',
          variants[variant],
          sizes[size],
          (disabled || loading) && 'opacity-40 cursor-not-allowed pointer-events-none',
          className,
        )}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
export default Button;
