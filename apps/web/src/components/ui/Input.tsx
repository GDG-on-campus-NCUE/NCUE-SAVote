import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substr(2, 9);

    return (
      <div className={`input-wrapper ${className}`}>
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`input-field ${error ? 'input-error' : ''}`}
          {...props}
        />
        {error && <span className="input-error-text">{error}</span>}
        {helperText && !error && <span className="input-helper-text">{helperText}</span>}
        
        <style>{`
          .input-wrapper {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs);
            width: 100%;
          }
          .input-label {
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
            color: var(--color-text-primary);
          }
          .input-field {
            padding: var(--spacing-sm) var(--spacing-md);
            border-radius: var(--border-radius-md);
            border: 1px solid var(--border-color);
            background-color: var(--color-surface);
            color: var(--color-text-primary);
            font-size: var(--font-size-base);
            transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
            outline: none;
          }
          .input-field:focus {
            border-color: var(--color-primary);
            box-shadow: 0 0 0 2px var(--color-background), 0 0 0 4px var(--color-primary);
          }
          .input-field:disabled {
            background-color: var(--color-surface-hover);
            cursor: not-allowed;
            opacity: 0.7;
          }
          .input-error {
            border-color: var(--color-error);
          }
          .input-error:focus {
            border-color: var(--color-error);
            box-shadow: 0 0 0 2px var(--color-background), 0 0 0 4px var(--color-error);
          }
          .input-error-text {
            font-size: var(--font-size-xs);
            color: var(--color-error);
          }
          .input-helper-text {
            font-size: var(--font-size-xs);
            color: var(--color-text-muted);
          }
        `}</style>
      </div>
    );
  }
);

Input.displayName = 'Input';
