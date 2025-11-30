import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', style, title, description, footer }) => {
  return (
    <div className={`card ${className}`} style={style}>
      {(title || description) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {description && <p className="card-description">{description}</p>}
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
      <style>{`
        .card {
          background-color: var(--color-surface);
          border-radius: var(--border-radius-lg);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }
        .card-header {
          padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-sm);
        }
        .card-title {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          margin: 0;
          color: var(--color-text-primary);
        }
        .card-description {
          margin: var(--spacing-xs) 0 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }
        .card-content {
          padding: var(--spacing-lg);
        }
        .card-footer {
          padding: var(--spacing-md) var(--spacing-lg);
          background-color: var(--color-surface-hover);
          border-top: 1px solid var(--border-color);
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
};
