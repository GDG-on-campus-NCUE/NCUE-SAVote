import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width, 
  height, 
  variant = 'text',
  style: customStyle
}) => {
  const style: React.CSSProperties = {
    width,
    height,
    ...customStyle
  };

  return (
    <div 
      className={`skeleton skeleton-${variant} ${className}`} 
      style={style}
    >
      <style>{`
        .skeleton {
          background-color: var(--color-surface-hover);
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .skeleton-text {
          margin-top: 0;
          margin-bottom: 0;
          height: auto;
          transform-origin: 0 55%;
          transform: scale(1, 0.60);
          border-radius: var(--border-radius-sm);
        }
        .skeleton-text:empty:before {
          content: "\\00a0";
        }
        .skeleton-circular {
          border-radius: 50%;
        }
        .skeleton-rectangular {
          border-radius: var(--border-radius-md);
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }
      `}</style>
    </div>
  );
};
