import React, { HTMLAttributes } from 'react';

export type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', ...rest }) => {
  return (
    <div className={`glass rounded-2xl border border-white/20 p-6 ${className}`} {...rest}>{children}</div>
  );
};
