import React from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { Navigation, NavItem } from '../m3/Navigation';
import { ThemeToggle } from '../m3/ThemeToggle';
import { LanguageSwitcher } from '../m3/LanguageSwitcher';
import { Home, Settings, LogOut, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../m3/Button';
import { AnimatedBackground } from '../AnimatedBackground';
import { useThemeStore } from '../../stores/themeStore';
import { InstallPrompt } from '../InstallPrompt';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    const { computedMode } = useThemeStore();

    const actualNavItems: NavItem[] = [
        { label: t('nav.home'), icon: <Home className="w-6 h-6" />, activeIcon: <Home className="w-6 h-6 fill-current" />, to: '/' },
    ];

    if (user?.role !== 'ADMIN') {
        actualNavItems.push({ 
            label: t('nav.user_guide'), 
            icon: <BookOpen className="w-6 h-6" />, 
            activeIcon: <BookOpen className="w-6 h-6 fill-current" />, 
            to: '/info/guide' 
        });
    }

    if (user?.role === 'ADMIN') {
        actualNavItems.push({ 
            label: t('nav.admin'), 
            icon: <Settings className="w-6 h-6" />, 
            activeIcon: <Settings className="w-6 h-6 fill-current" />, 
            to: '/admin' 
        });
    }

    // Top Bar
    const TopBar = () => (
        <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--color-surface)]/80 backdrop-blur-md z-40 border-b border-[var(--color-outline-variant)]/20 px-4 flex items-center justify-between transition-colors duration-300 md:pl-24">
             <div className="flex items-center gap-3">
                <img src="/sa_logo.png" alt="Logo" className="w-8 h-8 rounded-lg" />
                <h1 className="text-lg font-bold text-[var(--color-on-surface)] hidden sm:block">
                    {t('app.name')}
                </h1>
             </div>

             <div className="flex items-center gap-2">
                 {user && (
                     <div className="hidden md:flex flex-col items-end mr-4">
                         <span className="text-sm font-medium text-[var(--color-on-surface)]">
                            {user.name || user.role}
                         </span>
                         <span className="text-xs text-[var(--color-on-surface-variant)]">
                            {user.ip || 'Unknown IP'}
                         </span>
                     </div>
                 )}
                 <div title={t('common.toggle_theme', 'Switch Theme')}>
                    <ThemeToggle />
                 </div>
                 <div title={t('common.toggle_language', 'Switch Language')}>
                    <LanguageSwitcher />
                 </div>
                 <Button variant="text" onClick={logout} className="ml-2" icon={<LogOut className="w-5 h-5" />}>
                     <span className="hidden sm:inline">{t('app.logout')}</span>
                 </Button>
             </div>
        </header>
    );

    return (
        <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-on-background)] transition-colors duration-300">
            {/* Background Effects (Subtle in Light, more visible in Dark) */}
            {computedMode === 'dark' && (
                <div className="fixed inset-0 z-0 opacity-50 pointer-events-none">
                     <AnimatedBackground />
                </div>
            )}
            
            {/* Navigation Rail (Desktop) */}
            <Navigation items={actualNavItems} orientation="vertical" />

            {/* Top Bar */}
            <TopBar />

            {/* Main Content */}
            <main className="pt-20 pb-24 md:pl-24 md:pb-8 px-4 max-w-7xl mx-auto min-h-screen relative z-10">
                {children}
            </main>

            {/* Bottom Bar (Mobile) */}
            <Navigation items={actualNavItems} orientation="horizontal" />
            
            {/* PWA Install Prompt */}
            <InstallPrompt />
        </div>
    );
};
