import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatedBackground } from "../../../components/AnimatedBackground";
import { GlowOrbs } from "../../../components/GlowOrbs";
import { Card } from "../../../components/m3/Card";
import { Button } from "../../../components/m3/Button";
import { Dialog } from "../../../components/m3/Dialog";
import { ThemeToggle } from "../../../components/m3/ThemeToggle";
import { LanguageSwitcher } from "../../../components/m3/LanguageSwitcher";
import { LockKeyhole, GraduationCap, ArrowRight, FileText } from "lucide-react";
import { useThemeStore } from "../../../stores/themeStore";
import { UserGuideContent } from "../../info/components/UserGuideContent";

export const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Ensure we use the production API URL for SSO redirect
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    
  const { computedMode } = useThemeStore();
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const handleAdminLogin = () => {
    navigate('/auth/admin/login');
  };

  const handleSSOClick = () => {
    setIsGuideOpen(true);
  };

  const handleSSOConfirm = () => {
    window.location.href = `${API_URL}/auth/login`;
  };

  // Prevent scrolling on login page
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="relative flex justify-center items-center min-h-screen bg-[var(--color-background)] overflow-hidden transition-colors duration-300">
        {/* Background Effects */}
        {computedMode === 'dark' && (
            <div className="absolute inset-0 pointer-events-none">
                <AnimatedBackground />
                <GlowOrbs />
                <div className="grid-background absolute inset-0 opacity-20" />
            </div>
        )}

        {/* Top Right Controls */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
            <div title={t('common.toggle_theme', 'Switch Theme')}>
                <ThemeToggle />
            </div>
            <div title={t('common.toggle_language', 'Switch Language')}>
                <LanguageSwitcher />
            </div>
        </div>
        
        {/* Main Card */}
        <div className="relative z-10 w-[90%] max-w-[360px] animate-fade-in space-y-4">
          <Card variant="elevated" className="p-6 md:p-8 relative overflow-hidden text-center space-y-4 md:space-y-6 backdrop-blur-sm bg-[var(--color-surface)]/90 shadow-2xl border border-[var(--color-outline-variant)]">
            {/* Top Decoration */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            
            <div className="space-y-4">
              <div className="relative inline-block group">
                 <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                 <img 
                  src="/sa_logo.png"
                  alt="Logo"
                  className="relative w-20 h-20 md:w-24 md:h-24 mx-auto rounded-2xl shadow-lg transform transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              
              <div>
                  <h2 className="text-xl md:text-2xl font-bold text-[var(--color-on-surface)] leading-snug">
                    {t('app.name').includes('投票系統') ? (
                        <>
                            國立彰化師範大學學生會<br/>
                            <span className="text-2xl md:text-3xl text-[var(--color-primary)]">投票系統</span>
                        </>
                    ) : t('app.name')}
                  </h2>
                  <p className="text-[var(--color-on-surface-variant)] mt-2 text-sm">
                    {t('auth.login_subtitle')}
                  </p>
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              <Button 
                onClick={handleSSOClick} 
                className="w-full h-12 text-lg font-medium shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                icon={<GraduationCap className="w-5 h-5" />}
              >
                {t('auth.login_sso')}
              </Button>

               <Link to="/info/bulletin" className="block w-full">
                  <Button
                    variant="tonal"
                    className="w-full h-11"
                    icon={<FileText className="w-5 h-5" />}
                  >
                    {t('nav.bulletin', 'Election Bulletin')}
                  </Button>
               </Link>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--color-outline-variant)]"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[var(--color-surface)] px-3 text-[var(--color-on-surface-variant)] font-medium tracking-wider">{t('common.or')}</span>
                </div>
              </div>

              <Button
                variant="outlined"
                onClick={handleAdminLogin}
                className="w-full h-10 border-[var(--color-outline)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5"
                icon={<LockKeyhole className="w-4 h-4" />}
              >
                {t('auth.admin_login')}
              </Button>
            </div>
          </Card>
          
          <div className="mt-8 text-center space-y-2 animate-fade-in opacity-80 pb-6">
            <p className="text-[var(--color-on-surface-variant)] text-sm font-semibold">
              {t('app.developed_by')}
            </p>
            <div className="flex flex-col gap-0.5">
                <p className="text-[var(--color-on-surface-variant)] text-xs">
                {t('app.license')}
                </p>
                <p className="text-[var(--color-on-surface-variant)] text-[10px] opacity-60 font-mono">
                {t('app.copyright')}
                </p>
            </div>
          </div>
        </div>

        {/* User Guide Dialog */}
        <Dialog 
          open={isGuideOpen} 
          onClose={() => setIsGuideOpen(false)}
          title={t('info.guide_title', 'Voting Guide')}
          className="max-w-2xl"
          actions={
            <>
               <Button variant="text" onClick={() => setIsGuideOpen(false)}>
                  {t('common.cancel')}
               </Button>
               <Button onClick={handleSSOConfirm} icon={<ArrowRight className="w-4 h-4" />}>
                  {t('common.agree_continue')}
               </Button>
            </>
          }
        >
          <div className="py-2 max-h-[60vh] overflow-y-auto px-1">
             <UserGuideContent />
          </div>
        </Dialog>
    </div>
  );
};