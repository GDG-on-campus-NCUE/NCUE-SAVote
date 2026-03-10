import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';

export interface NavItem {
    label: string;
    icon: React.ReactNode;
    activeIcon?: React.ReactNode;
    to: string;
    end?: boolean;
}

export interface NavigationProps {
    items: NavItem[];
    className?: string;
    orientation?: 'horizontal' | 'vertical'; // vertical = rail, horizontal = bottom bar
}

export const Navigation: React.FC<NavigationProps> = ({ items, className, orientation = 'horizontal' }) => {
    return (
        <nav className={cn(
            "bg-[var(--color-surface)] text-[var(--color-on-surface)] transition-all duration-500",
            orientation === 'horizontal' 
                ? "fixed bottom-0 left-0 right-0 h-[72px] elevation-1 flex justify-around items-center z-50 md:hidden pb-safe border-t border-[var(--color-outline-variant)]/30 backdrop-blur-xl bg-[var(--color-surface)]/90" 
                : "hidden md:flex flex-col w-[80px] h-full border-r border-[var(--color-outline-variant)]/30 py-6 items-center gap-2 fixed left-0 top-0 z-50 pt-24 bg-[var(--color-surface)]",
            className
        )}>
            {items.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => cn(
                        "flex flex-col items-center justify-center gap-1 w-full relative group transition-all duration-300",
                        "cursor-pointer select-none py-2",
                        isActive ? "text-[var(--color-on-surface)]" : "text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
                    )}
                >
                    {({ isActive }) => (
                        <>
                            <div className={cn(
                                "flex items-center justify-center rounded-[16px] w-[56px] h-[32px] transition-all duration-400 ease-[cubic-bezier(0.2,0,0,1)] relative overflow-hidden",
                                isActive 
                                    ? "bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] elevation-1 shadow-sm" 
                                    : "group-hover:bg-[var(--color-on-surface-variant)]/10"
                            )}>
                                <div className={cn(
                                    "relative z-10 transition-transform duration-300",
                                    isActive ? "scale-110" : "group-hover:scale-105"
                                )}>
                                    {isActive && item.activeIcon ? item.activeIcon : item.icon}
                                </div>
                            </div>
                            <span className={cn(
                                "transition-all duration-300 text-[11px] leading-tight text-center max-w-[72px] truncate px-1 mt-1",
                                isActive ? "font-bold tracking-tight opacity-100" : "font-medium opacity-70 group-hover:opacity-100"
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
