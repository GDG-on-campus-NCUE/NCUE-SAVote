import { useTranslation } from 'react-i18next';
import { ShieldCheck, UserCircle2, Vote } from 'lucide-react';

export function UserGuideContent() {
  const { t } = useTranslation();

  const steps = [
    {
      title: t('info.guide_step1_title', 'SSO Authentication'),
      desc: t('info.guide_step1_desc', 'Log in securely using your school account (NCUESA SSO). We only verify your student status and eligibility; your password and personal data are never stored.'),
      icon: <UserCircle2 className="w-6 h-6 md:w-8 md:h-8" />,
      color: 'bg-blue-600 text-white',
    },
    {
      title: t('info.guide_step2_title', 'Generate Privacy Key'),
      desc: t('info.guide_step2_desc', 'The system generates a unique cryptographic key on your device. Using Zero-Knowledge Proof (ZKP) technology, this proves "I have the right to vote" while completely concealing "Who I am".'),
      icon: <ShieldCheck className="w-6 h-6 md:w-8 md:h-8" />,
      color: 'bg-purple-600 text-white',
    },
    {
      title: t('info.guide_step3_title', 'Cast Your Vote'),
      desc: t('info.guide_step3_desc', 'Select your candidate and submit. Your vote is recorded on the blockchain ledger along with the cryptographic proof. Once written, it is immutable and untraceable.'),
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
            {t('info.guide_privacy_note', 'This system uses advanced cryptography to strictly protect your privacy and anonymity.')}
          </span>
        </div>
      </div>
    </div>
  );
}
