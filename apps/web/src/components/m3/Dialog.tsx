import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface DialogProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    icon?: React.ReactNode;
    children?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export const Dialog: React.FC<DialogProps> = ({ 
    open, 
    onClose, 
    title, 
    description, 
    icon, 
    children, 
    actions,
    className 
}) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (open) setVisible(true);
        else {
            const timer = setTimeout(() => setVisible(false), 300); // Wait for exit animation
            return () => clearTimeout(timer);
        }
    }, [open]);

    if (!visible) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className={cn(
                    "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
                    open ? "opacity-100" : "opacity-0"
                )} 
                onClick={onClose}
            />

            {/* Dialog Container */}
            <div 
                className={cn(
                    "relative bg-[var(--color-surface)] text-[var(--color-on-surface)] rounded-[28px] max-w-md w-full p-6 elevation-3 transition-all duration-300",
                    open ? "scale-100 opacity-100" : "scale-90 opacity-0",
                    "flex flex-col gap-4",
                    className
                )}
            >
                {icon && (
                    <div className="flex justify-center mb-2">
                         <div className="text-[var(--color-secondary)]">
                             {icon}
                         </div>
                    </div>
                )}

                <div className="text-center sm:text-left">
                    {title && <h2 className="text-2xl font-normal leading-tight text-[var(--color-on-surface)] mb-2">{title}</h2>}
                    {description && <p className="text-[var(--color-on-surface-variant)] text-base">{description}</p>}
                </div>

                {children && <div className="mt-2">{children}</div>}

                <div className="flex justify-end gap-2 mt-4">
                    {actions ? actions : (
                        <Button variant="text" onClick={onClose}>Close</Button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
