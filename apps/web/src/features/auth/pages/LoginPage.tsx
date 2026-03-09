import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatedBackground } from "../../../components/AnimatedBackground";
import { GlowOrbs } from "../../../components/GlowOrbs";
import { Card } from "../../../components/m3/Card";
import { Button } from "../../../components/m3/Button";
import { Dialog } from "../../../components/m3/Dialog";
import { ThemeToggle } from "../../../components/m3/ThemeToggle";
import { LockKeyhole, GraduationCap, ArrowRight, FileText } from "lucide-react";
import { useThemeStore } from "../../../stores/themeStore";
import { UserGuideContent } from "../../info/components/UserGuideContent";

export const LoginPage = () => {
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    
  const { computedMode } = useThemeStore();
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const handleAdminLogin = () => {
    window.location.href = `${API_URL}/auth/admin/login`;
  };

  const handleSSOClick = () => {
    setIsGuideOpen(true);
  };

  const handleSSOConfirm = () => {
    window.location.href = `${API_URL}/auth/login`;
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="relative flex justify-center items-center min-h-screen bg-[var(--color-background)] overflow-hidden transition-colors duration-300">
        {computedMode === 'dark' && (
            <div className="absolute inset-0 pointer-events-none">
                <AnimatedBackground />
                <GlowOrbs />
                <div className="grid-background absolute inset-0 opacity-20" />
            </div>
        )}

        <div className="absolute top-4 right-4 z-20 flex gap-2">
            <div title="切換主題">
                <ThemeToggle />
            </div>
        </div>
        
        <div className="relative z-10 w-[90%] max-w-[360px] animate-fade-in space-y-4">
          <Card variant="elevated" className="p-6 md:p-8 relative overflow-hidden text-center space-y-4 md:space-y-6 backdrop-blur-sm bg-[var(--color-surface)]/90 shadow-2xl border border-[var(--color-outline-variant)]">
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
                    國立彰化師範大學學生會<br/>
                    <span className="text-2xl md:text-3xl text-[var(--color-primary)]">投票系統</span>
                  </h2>
                  <p className="text-[var(--color-on-surface-variant)] mt-2 text-sm">
                    請使用學校帳號登入
                  </p>
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              <Button 
                onClick={handleSSOClick} 
                className="w-full h-12 text-lg font-medium shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                icon={<GraduationCap className="w-5 h-5" />}
              >
                使用 NCUESA SSO 登入
              </Button>

               <Link to="/info/bulletin" className="block w-full">
                  <Button
                    variant="tonal"
                    className="w-full h-11"
                    icon={<FileText className="w-5 h-5" />}
                  >
                    選舉公報
                  </Button>
               </Link>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--color-outline-variant)]"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[var(--color-surface)] px-3 text-[var(--color-on-surface-variant)] font-medium tracking-wider">或</span>
                </div>
              </div>

              <Button
                variant="outlined"
                onClick={handleAdminLogin}
                className="w-full h-10 border-[var(--color-outline)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5"
                icon={<LockKeyhole className="w-4 h-4" />}
              >
                管理員登入
              </Button>
            </div>
          </Card>
          
          <div className="mt-8 text-center space-y-2 animate-fade-in opacity-80 pb-6">
            <p className="text-[var(--color-on-surface-variant)] text-sm font-semibold">
              Developed by Tai Ming Chen
            </p>
            <div className="flex flex-col gap-0.5">
                <p className="text-[var(--color-on-surface-variant)] text-xs">
                授權內容為 PolyForm Noncommercial License 不可商用
                </p>
            </div>
          </div>
        </div>

        <Dialog 
          open={isGuideOpen} 
          onClose={() => setIsGuideOpen(false)}
          title="投票系統操作指南"
          className="max-w-2xl"
          actions={
            <>
               <Button variant="text" onClick={() => setIsGuideOpen(false)}>
                  取消
               </Button>
               <Button onClick={handleSSOConfirm} icon={<ArrowRight className="w-4 h-4" />}>
                  同意並繼續
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
