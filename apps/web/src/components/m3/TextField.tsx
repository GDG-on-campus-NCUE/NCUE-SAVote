import React from 'react';
import { cn } from '../../lib/utils';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
    label: string;
    error?: string;
    helperText?: string;
    variant?: 'outlined' | 'filled';
    endAdornment?: React.ReactNode;
    multiline?: boolean;
    rows?: number;
}

export const TextField = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, TextFieldProps>(
    ({ className, label, error, helperText, variant = 'outlined', endAdornment, multiline, rows, placeholder, ...props }, ref) => {
        const inputClassName = cn(
            "peer block w-full appearance-none rounded-t-lg border-0 border-b-2 border-[var(--color-outline-variant)] bg-[var(--color-surface-variant)] px-4 pb-2.5 pt-5 text-base text-[var(--color-on-surface)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-0 transition-colors placeholder-transparent focus:placeholder-[var(--color-outline)]",
            variant === 'outlined' && "bg-transparent border border-[var(--color-outline)] rounded-lg px-4 pb-2.5 pt-4 focus:border-2 focus:border-[var(--color-primary)]",
            error && "border-[var(--color-error)] focus:border-[var(--color-error)]",
            endAdornment && "pr-12",
            multiline && "resize-none"
        );

        const labelClassName = cn(
            "absolute start-4 top-4 z-10 origin-[0] -translate-y-4 scale-75 transform text-sm text-[var(--color-on-surface-variant)] duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:text-[var(--color-primary)] rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4 pointer-events-none",
            variant === 'outlined' && "bg-[var(--color-background)] px-1 peer-focus:px-1 start-3",
            error && "text-[var(--color-error)] peer-focus:text-[var(--color-error)]"
        );

        return (
            <div className={cn("relative mb-6", className)}>
                {multiline ? (
                    <textarea
                        ref={ref as React.Ref<HTMLTextAreaElement>}
                        placeholder={placeholder || " "}
                        rows={rows || 3}
                        className={inputClassName}
                        {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                    />
                ) : (
                    <input
                        ref={ref as React.Ref<HTMLInputElement>}
                        placeholder={placeholder || " "}
                        className={inputClassName}
                        {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
                    />
                )}
                
                <label className={labelClassName}>
                    {label}
                </label>
                
                {endAdornment && !multiline && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]">
                        {endAdornment}
                    </div>
                )}
                
                {(error || helperText) && (
                    <p className={cn("mt-1 text-xs px-4 absolute -bottom-5 left-0 truncate w-full", error ? "text-[var(--color-error)]" : "text-[var(--color-on-surface-variant)]")}>
                        {error || helperText}
                    </p>
                )}
            </div>
        );
    }
);
TextField.displayName = "TextField";