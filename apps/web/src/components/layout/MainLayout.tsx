import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { Navigation, NavItem } from '../m3/Navigation';
import { ThemeToggle } from '../m3/ThemeToggle';
import { Home, Settings, LogOut, BookOpen, LockKeyhole, LayoutDashboard, User, Activity } from 'lucide-react';
import { Button } from '../m3/Button';
import { InstallPrompt } from '../InstallPrompt';
import { UserRole } from '@savote/shared-types';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
    const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

    const handleLogout = async () => {
        await logout();
        navigate('/auth/login', { replace: true });
    };

    const actualNavItems: NavItem[] = [];

    if (isAdmin) {
        actualNavItems.push({ 
            label: '總覽', 
            icon: <LayoutDashboard className="w-6 h-6" strokeWidth={1.5} />, 
            activeIcon: <LayoutDashboard className="w-6 h-6" strokeWidth={2.5} />, 
            to: '/admin',
            end: true
        });
        
        actualNavItems.push({ 
            label: '選舉管理', 
            icon: <Settings className="w-6 h-6" strokeWidth={1.5} />, 
            activeIcon: <Settings className="w-6 h-6" strokeWidth={2.5} />, 
            to: '/admin/elections' 
        });

        actualNavItems.push({ 
            label: '選舉人', 
            icon: <User className="w-6 h-6" strokeWidth={1.5} />, 
            activeIcon: <User className="w-6 h-6" strokeWidth={2.5} />, 
            to: '/admin/voters' 
        });

        actualNavItems.push({ 
            label: '開票監控', 
            icon: <Activity className="w-6 h-6" strokeWidth={1.5} />, 
            activeIcon: <Activity className="w-6 h-6" strokeWidth={2.5} />, 
            to: '/admin/monitoring' 
        });

        if (isSuperAdmin) {
            actualNavItems.push({ 
                label: '權限管理', 
                icon: <LockKeyhole className="w-6 h-6" strokeWidth={1.5} />, 
                activeIcon: <LockKeyhole className="w-6 h-6" strokeWidth={2.5} />, 
                to: '/admin/accounts' 
            });
        }
    } else {
        actualNavItems.push({ 
            label: '首頁', 
            icon: <Home className="w-6 h-6" strokeWidth={1.5} />, 
            activeIcon: <Home className="w-6 h-6" strokeWidth={2.5} />, 
            to: '/',
            end: true
        });
        
        actualNavItems.push({ 
            label: '指南', 
            icon: <BookOpen className="w-6 h-6" strokeWidth={1.5} />, 
            activeIcon: <BookOpen className="w-6 h-6" strokeWidth={2.5} />, 
            to: '/info/guide' 
        });
    }

    const TopBar = () => (
        <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--color-surface)]/80 backdrop-blur-xl z-40 border-b border-[var(--color-outline-variant)]/20 px-4 md:px-8 flex items-center justify-between transition-colors duration-500 md:pl-[104px]">
             <div className="flex items-center gap-3 animate-fade-in">
                <div className="p-1.5 rounded-xl bg-[var(--color-surface-container-high)] elevation-1 hidden sm:block">
                    <img src="/sa_logo.webp" alt="Logo" className="w-6 h-6 object-contain" />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-sm font-bold text-[var(--color-on-surface)] leading-tight">
                        {isAdmin ? "國立彰化師範大學 投票系統" : "國立彰化師範大學學生會"}
                    </h1>
                    <span className="text-[10px] text-[var(--color-primary)] font-medium tracking-widest uppercase opacity-80">
                        NCUE Student Association
                    </span>
                </div>
             </div>

             <div className="flex items-center gap-3">
                 {user && (
                     <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-full bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/30">
                         <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-[var(--color-on-surface)]">
                                {user.name || 'User'}
                            </span>
                            <span className="text-[10px] text-[var(--color-on-surface-variant)] opacity-70">
                                {user.role}
                            </span>
                         </div>
                         <div className="w-8 h-8 rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] flex items-center justify-center">
                            <User className="w-4 h-4" />
                         </div>
                     </div>
                 )}
                 <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <Button variant="text" onClick={handleLogout} className="ml-1 text-[var(--color-error)] hover:bg-[var(--color-error)]/10" icon={<LogOut className="w-4 h-4" />}>
                        <span className="hidden sm:inline text-xs font-bold">登出</span>
                    </Button>
                 </div>
             </div>
        </header>
    );

    return (
        <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-on-surface)] transition-colors duration-500">
            <Navigation items={actualNavItems} orientation="vertical" />
            <TopBar />

            <main className="pt-20 pb-28 md:pl-[80px] md:pb-12 px-4 md:px-12 max-w-7xl mx-auto min-h-screen relative z-10 animate-fade-in">
                {children}
            </main>

            <Navigation items={actualNavItems} orientation="horizontal" />
            <InstallPrompt />
        </div>
    );
};
