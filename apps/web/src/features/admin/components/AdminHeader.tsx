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
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8 animate-fade-in">
      <div className="flex items-start gap-4">
        {showBack && (
          <Button variant="tonal" className="rounded-full w-10 h-10 p-0 shrink-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
           <div className="flex items-center gap-2 mb-1">
             <h1 className="text-3xl font-bold text-[var(--color-on-background)]">{title}</h1>
             <span className="px-2 py-0.5 rounded-md bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] text-xs font-bold uppercase tracking-wider">
                SAVote Admin
             </span>
           </div>
          {subtitle && <p className="text-[var(--color-on-surface-variant)]">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 self-start md:self-center">
         {actions}
      </div>
    </div>
  );
}