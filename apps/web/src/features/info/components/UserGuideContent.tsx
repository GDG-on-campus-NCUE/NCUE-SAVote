import { UserCircle2, Lock, Fingerprint, Database } from 'lucide-react';

export function UserGuideContent() {
  const steps = [
    {
      title: '彰師單一登入 (SSO) 驗證',
      desc: '對接彰師標準授權介面進行資格審查。系統僅獲取必要的投票權限聲明，全程不經手且不儲存您的登入憑據，確保個人身分資訊受技術與法律雙重保障。',
      icon: <UserCircle2 className="w-6 h-6 md:w-7 md:h-7" />,
      color: 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]',
    },
    {
      title: '隱私保護金鑰與零知識證明生成',
      desc: '在您的本地終端生成專屬加密金鑰。基於零知識證明 (Zero-Knowledge Proof) 技術，您可在不揭露真實身分的前提下，向系統證明合法的投票權，實現絕對匿名與抗關聯性。',
      icon: <Fingerprint className="w-6 h-6 md:w-7 md:h-7" />,
      color: 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]',
    },
    {
      title: '端對端加密投票與分散式存證',
      desc: '選票經由高強度非對稱加密後傳輸，並寫入去中心化帳本存證。一旦完成提交，內容即具備不可竄改性與公開可稽核性，確保選舉過程絕對公正、透明。',
      icon: <Database className="w-6 h-6 md:w-7 md:h-7" />,
      color: 'bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)]',
    }
  ];

  return (
    <div className="py-2 px-1 md:px-2 max-w-4xl mx-auto scrollbar-hide">
      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
      
      <div className="relative">
        {/* Vertical connecting line - Material 3 Outline Variant */}
        <div className="absolute left-6 md:left-8 top-10 bottom-10 w-0.5 bg-[var(--color-outline-variant)] hidden md:block opacity-50" />

        <div className="space-y-6 md:space-y-10">
          {steps.map((step, index) => (
            <div key={index} className="relative flex flex-col md:flex-row gap-4 md:gap-8 items-start group">
              
              {/* Step Indicator Container */}
              <div className="relative z-10 flex-none hidden md:block">
                <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-300 group-hover:scale-105 shadow-sm ${step.color}`}>
                  {step.icon}
                </div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-medium text-[var(--color-outline)] opacity-40 font-mono">
                  STEP 0{index + 1}
                </div>
              </div>

              {/* Mobile Step Indicator */}
              <div className="flex items-center gap-3 md:hidden">
                <div className={`p-2 rounded-xl ${step.color}`}>
                  {step.icon}
                </div>
                <span className="text-xs font-bold tracking-widest text-[var(--color-primary)] opacity-70">STEP 0{index + 1}</span>
              </div>

              {/* Content Card - Material 3 Surface Container */}
              <div className="flex-1 w-full p-5 md:p-8 rounded-[28px] bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/20 hover:border-[var(--color-primary)]/30 transition-all duration-400 group-hover:shadow-md">
                <h3 className="text-lg md:text-xl font-semibold text-[var(--color-on-surface)] mb-3 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-[var(--color-on-surface-variant)] text-sm md:text-base leading-relaxed font-normal">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Assurance Footer */}
      <div className="mt-10 md:mt-16 flex justify-center px-4">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)]/50">
          <Lock className="w-4 h-4 text-[var(--color-primary)]" />
          <span className="text-[var(--color-on-surface-variant)] text-xs md:text-sm font-medium">
            基於後量子密碼學技術標準，確保所有選票均受到端對端隱私保護。
          </span>
        </div>
      </div>
    </div>
  );
}
