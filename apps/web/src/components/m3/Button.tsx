import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated' | 'fab';
  color?: 'primary' | 'secondary' | 'tertiary' | 'error';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'filled', color = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    
    const sizeStyles = {
        sm: "px-4 py-1.5 text-xs h-8",
        md: "px-6 py-2.5 text-sm h-10",
        lg: "px-8 py-3 text-base h-12"
    };

    const baseStyles = "relative inline-flex items-center justify-center gap-2 rounded-full font-medium transition-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden ripple select-none";
    
    const variants: Record<string, Record<string, string>> = {
        filled: {
            primary: "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:shadow-md active:shadow-none hover:bg-[var(--color-primary)]/90",
            secondary: "bg-[var(--color-secondary)] text-[var(--color-on-secondary)] hover:shadow-md",
            tertiary: "bg-[var(--color-tertiary)] text-[var(--color-on-tertiary)] hover:shadow-md",
            error: "bg-[var(--color-error)] text-[var(--color-on-error)] hover:shadow-md",
        },
        tonal: {
            primary: "bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] hover:shadow-sm hover:bg-[var(--color-primary-container)]/90",
            secondary: "bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] hover:shadow-sm",
            tertiary: "bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)] hover:shadow-sm",
            error: "bg-[var(--color-error-container)] text-[var(--color-on-error-container)] hover:shadow-sm",
        },
        outlined: {
            primary: "border border-[var(--color-outline)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 focus:bg-[var(--color-primary)]/10",
            secondary: "border border-[var(--color-outline)] text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10",
            tertiary: "border border-[var(--color-outline)] text-[var(--color-tertiary)] hover:bg-[var(--color-tertiary)]/10",
            error: "border border-[var(--color-outline)] text-[var(--color-error)] hover:bg-[var(--color-error)]/10",
        },
        text: {
            primary: "text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 px-3 min-w-0 h-auto py-2",
            secondary: "text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 px-3 min-w-0 h-auto py-2",
            tertiary: "text-[var(--color-tertiary)] hover:bg-[var(--color-tertiary)]/10 px-3 min-w-0 h-auto py-2",
            error: "text-[var(--color-error)] hover:bg-[var(--color-error)]/10 px-3 min-w-0 h-auto py-2",
        },
        elevated: {
             primary: "bg-[var(--color-surface-variant)] text-[var(--color-primary)] elevation-1 hover:elevation-2 hover:bg-[var(--color-surface-variant)]/80",
        },
        fab: { 
             primary: "rounded-2xl w-14 h-14 p-0 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] elevation-3 hover:elevation-4 transition-transform hover:scale-105 active:scale-95",
        }
    };

    const variantStyles = variants[variant]?.[color] || variants[variant]?.primary || "";
    const currentSize = variant === 'text' || variant === 'fab' ? '' : sizeStyles[size];

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, currentSize, variantStyles, className)}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && icon && <span className="flex items-center justify-center">{icon}</span>}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
