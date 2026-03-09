import { ShieldCheck, UserCircle2, Vote } from 'lucide-react';

export function UserGuideContent() {
  const steps = [
    {
      title: '單一登入驗證',
      desc: '使用您的學校單簽帳號進行身份驗證。系統僅確認您的學籍狀態與投票資格，絕不儲存您的密碼或個人隱私資料。',
      icon: <UserCircle2 className="w-6 h-6 md:w-8 md:h-8" />,
      color: 'bg-blue-600 text-white',
    },
    {
      title: '產生零知識隱私金鑰',
      desc: '系統將於您的裝置產生唯一的加密金鑰。此金鑰採用零知識證明技術 (Zero-Knowledge Proof)，確保您在證明「我有投票權」的同時，完全隱藏「我是誰」。這是保障匿名投票的核心。',
      icon: <ShieldCheck className="w-6 h-6 md:w-8 md:h-8" />,
      color: 'bg-purple-600 text-white',
    },
    {
      title: '加密投票',
      desc: '選擇候選人並送出選票。您的選票將與加密證明一同寫入區塊鏈帳本。一旦寫入，即永久不可篡改，且任何人都無法追蹤您的投票選擇。',
      icon: <Vote className="w-6 h-6 md:w-8 md:h-8" />,
      color: 'bg-green-600 text-white',
    }
  ];

  return (
    <div className="py-4 px-2 md:px-4 max-w-5xl mx-auto">
      <div className="relative">
        {/* Vertical connecting line */}
        <div className="absolute left-6 top-8 bottom-8 w-1 bg-[var(--color-outline-variant)] opacity-30 hidden md:block" />

        <div className="space-y-8 md:space-y-16">
          {steps.map((step, index) => (
            <div key={index} className="relative flex flex-col md:flex-row gap-4 md:gap-8 items-start group">
              
              {/* Number/Icon Indicator */}
              <div className="relative z-10 flex-none self-center md:self-auto">
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-lg transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${step.color}`}>
                  {step.icon}
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-2xl md:text-4xl font-black text-[var(--color-surface-variant)] opacity-20 select-none">
                  0{index + 1}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 pt-2 space-y-2 bg-[var(--color-surface)] p-4 md:p-6 rounded-2xl md:rounded-3xl border border-[var(--color-outline-variant)]/30 hover:shadow-xl hover:border-[var(--color-primary)]/30 transition-all duration-300">
                <h3 className="text-lg md:text-2xl font-bold text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)] transition-colors">
                  {step.title}
                </h3>
                <p className="text-[var(--color-on-surface-variant)] text-sm md:text-lg leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Note Footer */}
      <div className="mt-12 md:mt-20 flex justify-center">
        <div className="inline-flex items-center gap-3 px-4 py-2 md:px-6 md:py-3 rounded-full bg-[var(--color-primary-container)]/30 text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]">
          <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-[var(--color-primary)]" />
          <span className="font-medium text-xs md:text-sm">
            本系統採用先進密碼學及區塊鏈技術，絕對保障您的投票隱私與匿名性。
          </span>
        </div>
      </div>
    </div>
  );
}
