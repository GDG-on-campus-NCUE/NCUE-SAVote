import { useState } from 'react';
import { authApi } from '../services/auth.api';

export const LoginButton = () => {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 600);

    authApi.login();
  };

  return (
    <button
      onClick={handleClick}
      className="icon-wiggle relative overflow-hidden w-full flex justify-center items-center px-6 py-4 glass-strong border border-blue-400/50 text-white text-base font-semibold rounded-xl hover:border-blue-400/80 hover:bg-blue-500/20 focus:outline-none transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/40 backdrop-blur-xl group"
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="button-ripple"
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}
      <svg 
        className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2.5} 
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
        />
      </svg>
      <span className="relative z-10">使用學校帳號登入 (SAML SSO)</span>
    </button>
  );
};
