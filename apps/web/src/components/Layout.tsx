import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, showFooter = true }) => {
  return (
    <div className="layout">
      <Header />
      <main className="main-content container">
        {children}
      </main>
      {showFooter && <Footer />}
      <style>{`
        .layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background-color: var(--color-background);
          color: var(--color-text-primary);
        }
        .main-content {
          flex: 1;
          padding-top: var(--spacing-xl);
          padding-bottom: var(--spacing-xl);
          width: 100%;
        }
      `}</style>
    </div>
  );
};
