import React from 'react';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
}

export const GlassInput: React.FC<GlassInputProps> = ({ label, helperText, className = '', ...props }) => {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-white/90">{label}</label>}
      <input
        className={`w-full rounded-xl bg-white/5 border border-white/20 px-3 py-2 text-white placeholder:text-white/40 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 ${className}`}
        {...props}
      />
      {helperText && <p className="text-xs text-white/70">{helperText}</p>}
    </div>
  );
};
