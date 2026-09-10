import { forwardRef, useId } from 'react';
import clsx from 'clsx';

const Input = forwardRef(
  ({ label, error, helperText, className, id, 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const messageId = `${inputId}-message`;
    const description = [describedBy, (error || helperText) && messageId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="min-w-0 space-y-1.5">
        {label && <label htmlFor={inputId} className="form-label">{label}</label>}
        <input
          ref={ref}
          id={inputId}
          aria-describedby={description}
          aria-invalid={error ? true : invalid}
          className={clsx(
            'form-input',
            error && '!border-danger-500 focus:!shadow-[0_0_0_3px_rgba(239,68,68,.12)]',
            className,
          )}
          {...props}
        />
        {error && <p id={messageId} className="text-xs text-danger-500">{error}</p>}
        {helperText && !error && <p id={messageId} className="text-muted text-xs">{helperText}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
