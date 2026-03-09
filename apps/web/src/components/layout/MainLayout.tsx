import React from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { Navigation, NavItem } from '../m3/Navigation';
import { ThemeToggle } from '../m3/ThemeToggle';
import { Home, Settings, LogOut, BookOpen, LockKeyhole, LayoutDashboard } from 'lucide-react';
import { Button } from '../m3/Button';
import { AnimatedBackground } from '../AnimatedBackground';
import { useThemeStore } from '../../stores/themeStore';
import { InstallPrompt } from '../InstallPrompt';
import { UserRole } from '@savote/shared-types';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { user, logout } = useAuth();
    const { computedMode } = useThemeStore();

    const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
    const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

    const actualNavItems: NavItem[] = [];

    if (isAdmin) {
        actualNavItems.push({ 
            label: '管理首頁', 
            icon: <LayoutDashboard className="w-6 h-6" />, 
            activeIcon: <LayoutDashboard className="w-6 h-6 fill-current" />, 
            to: '/admin' 
        });
        
        actualNavItems.push({ 
            label: '選舉管理', 
            icon: <Settings className="w-6 h-6" />, 
            activeIcon: <Settings className="w-6 h-6 fill-current" />, 
            to: '/admin/elections' 
        });

        if (isSuperAdmin) {
            actualNavItems.push({ 
                label: '權限管理', 
                icon: <LockKeyhole className="w-6 h-6" />, 
                activeIcon: <LockKeyhole className="w-6 h-6 fill-current" />, 
                to: '/admin/accounts' 
            });
        }
    } else {
        actualNavItems.push({ 
            label: '首頁', 
            icon: <Home className="w-6 h-6" />, 
            activeIcon: <Home className="w-6 h-6 fill-current" />, 
            to: '/' 
        });
        
        actualNavItems.push({ 
            label: '使用說明', 
            icon: <BookOpen className="w-6 h-6" />, 
            activeIcon: <BookOpen className="w-6 h-6 fill-current" />, 
            to: '/info/guide' 
        });
    }

    const TopBar = () => (
        <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--color-surface)]/80 backdrop-blur-md z-40 border-b border-[var(--color-outline-variant)]/20 px-4 flex items-center justify-between transition-colors duration-300 md:pl-24">
             <div className="flex items-center gap-3">
                <img src="/sa_logo.png" alt="Logo" className="w-8 h-8 rounded-lg" />
                <h1 className="text-lg font-bold text-[var(--color-on-surface)] hidden sm:block">
                    {isAdmin ? "國立彰化師範大學學生會 投票系統 - 管理後台" : "國立彰化師範大學學生會 投票系統"}
                </h1>
             </div>

             <div className="flex items-center gap-2">
                 {user && (
                     <div className="hidden md:flex flex-col items-end mr-4">
                         <span className="text-sm font-medium text-[var(--color-on-surface)]">
                            {user.name || user.role}
                         </span>
                         <span className="text-xs text-[var(--color-on-surface-variant)]">
                            {user.role} | {user.ip || 'Local'}
                         </span>
                     </div>
                 )}
                 <ThemeToggle />
                 <Button variant="text" onClick={logout} className="ml-2" icon={<LogOut className="w-5 h-5" />}>
                     <span className="hidden sm:inline">登出</span>
                 </Button>
             </div>
        </header>
    );

    return (
        <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-on-background)] transition-colors duration-300">
            {computedMode === 'dark' && (
                <div className="fixed inset-0 z-0 opacity-50 pointer-events-none">
                     <AnimatedBackground />
                </div>
            )}
            
            <Navigation items={actualNavItems} orientation="vertical" />
            <TopBar />

            <main className="pt-20 pb-24 md:pl-24 md:pb-8 px-4 max-w-7xl mx-auto min-h-screen relative z-10">
                {children}
            </main>

            <Navigation items={actualNavItems} orientation="horizontal" />
            <InstallPrompt />
        </div>
    );
};
