import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginButton } from "../components/LoginButton";
import { Layout } from "../../../components/Layout";
import { AnimatedBackground } from "../../../components/AnimatedBackground";
import { GlowOrbs } from "../../../components/GlowOrbs";

export const LoginPage = () => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const navigate = useNavigate();
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  
  const handleAdminLogin = () => {
    navigate('/auth/admin/login');
  };

  const handleDevLogin = () => {
    window.location.href = `${API_URL}/auth/dev/login`;
  };

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 600);
  };

  // 登入頁不允許上下滾動
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <Layout showFooter={false}>
      {/* 深色漸層背景 */}
      <div className="relative flex justify-center items-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* 背景效果 */}
        <AnimatedBackground />
        <GlowOrbs />
        
        {/* 網格背景 */}
        <div className="grid-background absolute inset-0 opacity-20" />
        
        {/* 主容器 */}
        <div className="relative z-10 w-full max-w-md px-4">
          {/* Glassmorphism 卡片 */}
          <div className="glass rounded-3xl shadow-2xl p-8 relative overflow-hidden" style={{ animation: 'fadeInUp 0.8s ease-out' }}>
            {/* Google 彩虹掃描線 */}
            <div className="scan-line absolute top-0 left-0 right-0 h-1 rounded-t-3xl opacity-50" />
            
            <div className="text-center pb-6 pt-2 stagger-fade-in">
              <div className="mb-6">
                {/* Google 四色圓點 - 浮動動畫 */}
                <div className="flex justify-center gap-3 mb-6">
                  <div className="dot-float-1 w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></div>
                  <div className="dot-float-2 w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                  <div className="dot-float-3 w-3 h-3 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50"></div>
                  <div className="dot-float-4 w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                </div>
                {/* SA Logo 彈入動畫 */}
                <img 
                  src="/sa_logo.png"
                  alt="學生會 Logo"
                  className="w-20 h-20 mx-auto rounded-2xl shadow-lg"
                  style={{ animation: 'bounceIn 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }}
                />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                國立彰化師範大學
              </h2>
              <h3 className="text-xl font-semibold text-blue-200 mb-4">
                學生會投票系統
              </h3>
              <p className="text-gray-300 text-sm">
                請使用學校 Portal 帳號登入
              </p>
            </div>
            
            <div className="space-y-4 mt-8 stagger-fade-in">
              <LoginButton />
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 glass-subtle rounded-full text-gray-300">其他登入方式</span>
                </div>
              </div>

              {/* 管理員登入按鈕 - 藍光效果 */}
              <button
                onClick={(e) => {
                  createRipple(e);
                  handleAdminLogin();
                }}
                className="icon-wiggle relative overflow-hidden w-full flex justify-center items-center px-5 py-3.5 glass-strong text-sm font-medium rounded-xl text-blue-300 hover:text-white glow-blue-border hover:glow-blue-strong focus:outline-none transition-all duration-300 group"
              >
                {ripples
                  .filter((r) => r.id)
                  .map((ripple) => (
                    <span
                      key={ripple.id}
                      className="button-ripple"
                      style={{ left: ripple.x, top: ripple.y }}
                    />
                  ))}
                <svg className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span>管理員登入 (Admin Portal)</span>
              </button>
              
              {import.meta.env.DEV && (
                <>
                  <button
                    onClick={(e) => {
                      createRipple(e);
                      handleDevLogin();
                    }}
                    className="icon-rotate relative overflow-hidden w-full flex justify-center items-center px-5 py-3.5 glass text-sm font-medium rounded-xl text-gray-300 hover:text-white border border-dashed border-gray-500/50 hover:border-gray-400 focus:outline-none transition-all duration-300 group"
                  >
                    {ripples
                      .filter((r) => r.id)
                      .map((ripple) => (
                        <span
                          key={ripple.id}
                          className="button-ripple"
                          style={{ left: ripple.x, top: ripple.y }}
                        />
                      ))}
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>開發測試登入 (Dev Only)</span>
                  </button>
                  
                  <p className="text-xs text-center text-gray-400 mt-3">
                    🔧 開發環境專用入口
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
