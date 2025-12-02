// import React from 'react';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="glow-orb glow-blue w-[400px] h-[400px] -top-32 -left-16" />
      <div className="glow-orb glow-green w-[380px] h-[380px] bottom-0 right-0" />
      <div className="glow-orb glow-purple w-[320px] h-[320px] top-1/2 -translate-y-1/2 right-1/3" />
      <div className="grid-background absolute inset-0 opacity-30" />
    </div>
  );
}
