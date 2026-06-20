import { forwardRef } from 'react';
import clsx from 'clsx';

const Select = forwardRef(
  ({ label, error, helperText, children, className, ...props }, ref) => {
    return (
      <div className="min-w-0 space-y-1.5">
        {label && <label className="form-label">{label}</label>}
        <select
          ref={ref}
          className={clsx(
            'form-select',
            error && '!border-danger-500 focus:!shadow-[0_0_0_3px_rgba(239,68,68,.12)]',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-danger-500">{error}</p>}
        {helperText && !error && <p className="text-muted text-xs">{helperText}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
export default Select;
