import React from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { Button } from './ui/Button';

export const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="header">
      <div className="container flex justify-between items-center" style={{ height: '100%' }}>
        <div className="flex items-center gap-md">
          <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', margin: 0 }}>
            國立彰化師範大學 學生會投票系統
          </h1>
          {isAuthenticated && user && (
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              班級：{user.class}
            </span>
          )}
        </div>
        
        {isAuthenticated && (
          <Button variant="danger" size="sm" onClick={logout}>
            登出
          </Button>
        )}
      </div>
      <style>{`
        .header {
          height: 64px;
          background-color: var(--color-surface);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 10;
        }
      `}</style>
    </header>
  );
};
