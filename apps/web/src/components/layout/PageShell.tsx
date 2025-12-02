import React from 'react';
import { AnimatedBackground } from '../AnimatedBackground';
import { GlowOrbs } from '../GlowOrbs';

type PageShellProps = {
  children: React.ReactNode;
  withEffects?: boolean;
  className?: string;
};

export const PageShell: React.FC<PageShellProps> = ({ children, withEffects = true, className = '' }) => {
  return (
    <div className={`relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 ${className}`}>
      {withEffects && (
        <>
          <AnimatedBackground />
          <GlowOrbs />
        </>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
