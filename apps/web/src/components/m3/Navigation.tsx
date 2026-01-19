import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';

export interface NavItem {
    label: string;
    icon: React.ReactNode;
    activeIcon?: React.ReactNode;
    to: string;
}

export interface NavigationProps {
    items: NavItem[];
    className?: string;
    orientation?: 'horizontal' | 'vertical'; // vertical = rail, horizontal = bottom bar
}

export const Navigation: React.FC<NavigationProps> = ({ items, className, orientation = 'horizontal' }) => {
    return (
        <nav className={cn(
            "bg-[var(--color-surface)] text-[var(--color-on-surface)] transition-all duration-300",
            orientation === 'horizontal' 
                ? "fixed bottom-0 left-0 right-0 h-20 elevation-2 flex justify-around items-center z-50 md:hidden pb-safe border-t border-[var(--color-outline-variant)]" 
                : "hidden md:flex flex-col w-20 h-full border-r border-[var(--color-outline-variant)] py-4 items-center gap-4 fixed left-0 top-0 z-50 pt-20 bg-[var(--color-surface)]",
            className
        )}>
            {items.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => cn(
                        "flex flex-col items-center justify-center gap-1 w-full relative group min-h-[56px] min-w-[64px] rounded-lg p-2 transition-transform active:scale-95",
                        "text-xs font-medium cursor-pointer select-none",
                        isActive ? "text-[var(--color-on-surface)]" : "text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
                    )}
                >
                    {({ isActive }) => (
                        <>
                            <div className={cn(
                                "flex items-center justify-center rounded-2xl w-16 h-8 transition-all duration-300 overflow-hidden relative",
                                isActive 
                                    ? "bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] shadow-sm" 
                                    : "group-hover:bg-[var(--color-on-surface-variant)]/10"
                            )}>
                                {/* Animated Background Layer */}
                                <div className={cn(
                                    "absolute inset-0 bg-current opacity-0 transition-opacity duration-300",
                                    isActive ? "opacity-0" : "group-hover:opacity-10"
                                )} />
                                
                                {isActive && item.activeIcon ? item.activeIcon : item.icon}
                            </div>
                            <span className={cn(
                                "transition-all duration-300 text-[11px] leading-tight text-center max-w-[64px] truncate px-1",
                                isActive ? "font-bold tracking-wide" : "font-medium opacity-80 group-hover:opacity-100"
                            )}>
                                {item.label}
                            </span>
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    );
};