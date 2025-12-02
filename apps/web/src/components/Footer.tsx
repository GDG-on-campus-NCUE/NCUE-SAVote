import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="glass-subtle border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-sm text-gray-300">
            &copy; {new Date().getFullYear()} 國立彰化師範大學學生會. All rights reserved.
          </p>
          
          {/* GDGoC Attribution */}
          <div className="flex items-center gap-3 glass rounded-full px-4 py-2">
            <span className="text-sm text-gray-300">Powered by</span>
            <img 
              src="/gdg_logo.png" 
              alt="GDGoC NCUE Logo" 
              className="h-6 w-auto"
            />
            <span className="text-sm font-semibold text-blue-200">GDGoC NCUE</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
