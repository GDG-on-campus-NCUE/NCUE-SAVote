import { useState } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "../../../components/m3/ThemeToggle";
import { GraduationCap, ArrowRight, FileText, ShieldCheck, ChevronRight } from "lucide-react";
import { UserGuideContent } from "../../info/components/UserGuideContent";
import { Dialog } from "../../../components/m3/Dialog";
import { Button } from "../../../components/m3/Button";

export const LoginPage = () => {
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const [isGuideOpen, setIsGuideOpen] = useState(false);

//   const handleAdminLogin = () => {
//     sessionStorage.setItem('loginIntent', 'admin');
//     window.location.href = `${API_URL}/auth/admin/login`;
//   };

  const handleSSOClick = () => {
    setIsGuideOpen(true);
  };

  const handleSSOConfirm = () => {
    sessionStorage.setItem('loginIntent', 'home');
    window.location.href = `${API_URL}/auth/login`;
  };

  return (
    <div className="relative flex flex-col md:flex-row min-h-[100dvh] bg-[var(--color-surface)] transition-colors duration-500 font-sans select-none selection:bg-transparent overflow-y-auto md:overflow-hidden">
        
        {/* Decorative Side Panel (Desktop Only) */}
        <div className="hidden md:flex md:w-1/2 lg:w-[55%] bg-[var(--color-surface-container-low)] dark:bg-[var(--color-surface-container-lowest)] relative items-center justify-center overflow-hidden border-r border-[var(--color-outline-variant)]/20">
            <div className="absolute inset-0 bg-[var(--color-primary)]/[0.015]" />
            
            <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" 
                 style={{ backgroundImage: `radial-gradient(var(--color-primary) 1px, transparent 1px)`, 
                          backgroundSize: '40px 40px' }} />
            
            <div className="relative z-10 flex flex-col items-center text-center px-12 animate-fade-in">
                <div className="mb-10 p-8 rounded-[48px] bg-[var(--color-surface)] elevation-1 hover:elevation-2 transition-standard">
                    <img 
                        src="/sa_logo.webp"
                        alt="NCUE SA Logo"
                        className="w-32 h-32 lg:w-44 lg:h-44 object-contain"
                    />
                </div>
                <h1 className="type-display-medium text-[var(--color-on-surface)] mb-3 font-bold tracking-tight">
                    國立彰化師範大學學生會
                </h1>
                <p className="type-headline-small text-[var(--color-primary)] font-medium tracking-[0.25em] mb-10 opacity-80">
                    學生選舉系統
                </p>
                <div className="w-24 h-1 bg-[var(--color-primary-container)] rounded-full opacity-40" />
            </div>

            <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-[var(--color-primary-container)] opacity-15 blur-[120px]" />
        </div>

        {/* Top Controls */}
        <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50">
            <ThemeToggle />
        </div>
        
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 md:py-12 relative bg-[var(--color-surface)] min-h-fit">
            
            {/* Mobile Header */}
            <div className="md:hidden mb-8 flex flex-col items-center text-center animate-fade-in">
                <div className="mb-4 p-4 rounded-[32px] bg-[var(--color-surface-container-high)] elevation-1">
                    <img 
                        src="/sa_logo.webp"
                        alt="Logo"
                        className="w-16 h-16 object-contain"
                    />
                </div>
                <h2 className="type-headline-small text-[var(--color-on-surface)] font-bold">
                    國立彰化師範大學學生會
                </h2>
                <p className="type-title-medium text-[var(--color-primary)] tracking-[0.2em] font-medium mt-1">
                    學生選舉系統
                </p>
            </div>

            {/* Login Card */}
            <div className="w-full max-w-[420px] animate-slide-up">
                <div className="bg-[var(--color-surface-container-low)] md:bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/50 rounded-[40px] p-8 md:p-12 elevation-1 hover:elevation-2 transition-all duration-500">
                    
                    <div className="mb-8 text-center md:text-left">
                        <h3 className="text-3xl font-bold text-[var(--color-on-surface)] mb-2 tracking-tight">
                            歡迎回來
                        </h3>
                        <p className="text-base text-[var(--color-on-surface-variant)] font-normal opacity-70 leading-relaxed">
                            請使用彰化師大 SSO 帳號<br className="hidden md:block"/>登入以進行投票
                        </p>
                    </div>

                    <div className="space-y-5">
                        {/* Primary Action Button */}
                        <button 
                            onClick={handleSSOClick}
                            className="w-full flex items-center justify-between pl-8 pr-3 h-18 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-[24px] transition-standard hover:opacity-95 active:scale-[0.98] group relative overflow-hidden shadow-lg shadow-[var(--color-primary)]/10"
                        >
                            <span className="text-lg font-medium flex items-center gap-4">
                                <GraduationCap className="w-7 h-7" />
                                單一簽入 登入
                            </span>
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                <ChevronRight className="w-7 h-7" />
                            </div>
                        </button>

                        {/* Secondary Action */}
                        <Link to="/info/bulletin" className="block w-full">
                            <div className="flex items-center justify-center gap-3 h-16 w-full rounded-[24px] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-base font-medium hover:bg-[var(--color-primary)]/[0.04] hover:border-[var(--color-primary)]/30 transition-standard active:bg-[var(--color-primary)]/[0.08]">
                                <FileText className="w-5 h-5 opacity-60" />
                                查看選舉公報
                            </div>
                        </Link>
                    </div>

                    {/* Divider */}
                    <div className="relative flex items-center my-10">
                        <div className="grow h-[1px] bg-[var(--color-outline-variant)]/30" />
                        <span className="px-5 text-[10px] font-bold text-[var(--color-outline)] uppercase tracking-[0.2em] opacity-40">
                            Admin Access
                        </span>
                        <div className="grow h-[1px] bg-[var(--color-outline-variant)]/30" />
                    </div>

                    {/* Admin Access */}
                    <button
                        onClick={handleAdminLogin}
                        className="w-full flex items-center justify-center gap-2 h-10 rounded-full text-sm font-medium text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.04] transition-standard opacity-60 hover:opacity-100"
                    >
                        <LockKeyhole className="w-3.5 h-3.5" />
                        系統管理員登入
                    </button>
                </div>
            </div>

            {/* Enhanced Footer */}
            <footer className="mt-12 md:mt-16 text-center space-y-5 pb-8 md:pb-0">
                <div className="flex items-center justify-center gap-3 py-1.5 px-5 rounded-full bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)]/20 text-[var(--color-on-surface)] elevation-1 mx-auto w-fit">
                    <ShieldCheck className="w-4 h-4 text-[var(--color-primary)] opacity-80" />
                    <span className="text-xs font-medium tracking-wide opacity-80">Student Autonomy Election System</span>
                </div>
                
                <div className="space-y-1.5">
                    <p className="text-sm font-medium text-[var(--color-on-surface-variant)] opacity-70">
                        &copy; 2026 Developed by Tai Ming Chen, Kuang Tsung Chiang
                    </p>
                    <p className="text-[11px] font-normal text-[var(--color-outline)] max-w-[280px] mx-auto leading-relaxed opacity-60">
                        Licensed under PolyForm Noncommercial<br/>
                        Non-Commercial Use Only
                    </p>
                </div>
            </footer>
        </main>

        <style dangerouslySetInnerHTML={{ __html: `
            .animate-fade-in { animation: fade-in 1s cubic-bezier(0.2, 0, 0, 1) forwards; }
            .animate-slide-up { animation: slide-up 1.2s cubic-bezier(0.2, 0, 0, 1) forwards; }
            .h-18 { height: 4.5rem; }
        `}} />

        <Dialog 
          open={isGuideOpen} 
          onClose={() => setIsGuideOpen(false)}
          title="投票系統操作指南"
          className="max-w-2xl"
          actions={
            <>
               <Button variant="text" onClick={() => setIsGuideOpen(false)} className="font-medium">
                  取消
               </Button>
               <Button onClick={handleSSOConfirm} icon={<ArrowRight className="w-4 h-4" />} className="font-medium">
                  同意並繼續
               </Button>
            </>
          }
        >
          <div className="py-2 max-h-[60vh] overflow-y-auto px-1 font-normal scrollbar-hide">
             <UserGuideContent />
          </div>
        </Dialog>
    </div>
  );
};
