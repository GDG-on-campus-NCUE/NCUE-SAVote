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
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-fade-in">
      <div className="flex items-start gap-5">
        {showBack && (
          <Button 
            variant="tonal" 
            className="rounded-2xl w-12 h-12 p-0 shrink-0 elevation-1 hover:elevation-2 transition-standard" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
        )}
        <div className="space-y-1">
           <div className="flex items-center gap-3">
             <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-on-surface)] tracking-tight">
                {title}
             </h1>
             <div className="h-2 w-2 rounded-full bg-[var(--color-primary)] opacity-50 hidden md:block" />
           </div>
          {subtitle && (
            <p className="text-sm md:text-base text-[var(--color-on-surface-variant)] font-medium opacity-80">
                {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 self-start md:self-end bg-[var(--color-surface-container-low)] p-1.5 rounded-[20px] border border-[var(--color-outline-variant)]/30">
         {actions}
      </div>
    </div>
  );
}
