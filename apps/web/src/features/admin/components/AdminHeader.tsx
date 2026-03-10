import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/m3/Button';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  actions?: React.ReactNode;
}

export function AdminHeader({ title, subtitle, showBack = true, actions }: AdminHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end justify-between mb-8 animate-fade-in">
      <div className="flex items-start gap-4 md:gap-5">
        {showBack && (
          <Button 
            variant="tonal" 
            className="hidden md:flex rounded-xl w-12 h-12 p-0 shrink-0 elevation-1 hover:elevation-2 transition-standard" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
        )}
        <div className="space-y-0.5">
           <div className="flex items-center gap-3">
             <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-on-surface)] tracking-tight">
                {title}
             </h1>
             <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] opacity-40 hidden md:block" />
           </div>
          {subtitle && (
            <p className="text-xs md:text-sm text-[var(--color-on-surface-variant)] font-medium opacity-70">
                {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 self-start md:self-end">
           {actions}
        </div>
      )}
    </div>
  );
}
