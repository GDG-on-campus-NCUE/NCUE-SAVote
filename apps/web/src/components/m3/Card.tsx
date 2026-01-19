import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'elevated' | 'filled' | 'outlined';
    interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'elevated', interactive = false, ...props }, ref) => {
        const baseStyles = "rounded-xl overflow-hidden transition-standard bg-[var(--color-surface)] text-[var(--color-on-surface)]";
        
        const variants = {
            elevated: "elevation-1",
            filled: "bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)]",
            outlined: "border border-[var(--color-outline-variant)]",
        };

        const interactiveStyles = interactive 
            ? "hover:elevation-2 cursor-pointer hover:-translate-y-0.5 active:scale-[0.99]" 
            : "";

        return (
            <div 
                ref={ref}
                className={cn(baseStyles, variants[variant], interactiveStyles, className)}
                {...props}
            />
        );
    }
);
Card.displayName = "Card";
