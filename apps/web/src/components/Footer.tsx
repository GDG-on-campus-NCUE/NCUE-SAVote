import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container text-center">
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
          &copy; {new Date().getFullYear()} NCU ESA. All rights reserved.
        </p>
      </div>
      <style>{`
        .footer {
          padding: var(--spacing-lg) 0;
          background-color: var(--color-surface);
          border-top: 1px solid var(--border-color);
          margin-top: auto;
        }
      `}</style>
    </footer>
  );
};
