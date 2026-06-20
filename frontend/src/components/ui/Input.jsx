import { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="min-w-0 space-y-1.5">
        {label && <label className="form-label">{label}</label>}
        <input
          ref={ref}
          className={clsx(
            'form-input',
            error && '!border-danger-500 focus:!shadow-[0_0_0_3px_rgba(239,68,68,.12)]',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger-500">{error}</p>}
        {helperText && !error && <p className="text-muted text-xs">{helperText}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
