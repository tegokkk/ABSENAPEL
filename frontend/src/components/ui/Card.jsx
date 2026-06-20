import clsx from 'clsx';

export default function Card({ className, children, ...props }) {
  return (
    <div
      className={clsx('section-card space-y-4 p-4 md:p-5', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={clsx('section-header', className)}>
      <div className="flex-1 min-w-0">
        <h3
          className="text-primary truncate text-base font-bold leading-tight"
        >
          {title}
        </h3>
        {subtitle && <p className="text-muted mt-0.5 text-xs">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
