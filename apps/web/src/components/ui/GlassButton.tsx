import React from 'react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export const GlassButton: React.FC<GlassButtonProps> = ({ label, className = '', ...props }) => {
  return (
    <button
      className={`relative inline-flex items-center justify-center px-4 py-2 rounded-full bg-white/10 text-white font-medium border border-white/30 shadow-md hover:bg-white/20 hover:shadow-blue-500/40 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${className}`}
      {...props}
    >
      {label}
    </button>
  );
};
