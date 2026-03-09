import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../../components/m3/Card';
import { 
    Vote, 
    Users, 
    Activity, 
    ShieldCheck, 
    ChevronRight 
} from 'lucide-react';
import { UserRole } from '@savote/shared-types';

export function AdminDashboardPage() {
  const { user } = useAuth();

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

  if (user && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (!user) return null;

  const adminFeatures = [
      {
          title: '選舉管理',
          description: '建立選舉與管理候選人。',
          icon: <Vote className="w-8 h-8 text-[var(--color-primary)]" />,
          to: '/admin/elections',
          color: 'bg-blue-100 dark:bg-blue-900/20'
      },
      {
          title: '選舉人名冊管理',
          description: '匯入與管理符合資格的選舉人。',
          icon: <Users className="w-8 h-8 text-[var(--color-primary)]" />,
          to: '/admin/voters',
          color: 'bg-green-100 dark:bg-green-900/20'
      },
      {
          title: '開票監控',
          description: '查看已結束選舉的結果。',
          icon: <Activity className="w-8 h-8 text-[var(--color-primary)]" />,
          to: '/admin/monitoring',
          color: 'bg-orange-100 dark:bg-orange-900/20'
      },
      {
          title: '管理員帳號管理',
          description: '管理後台管理員帳號。',
          icon: <ShieldCheck className="w-8 h-8 text-[var(--color-primary)]" />,
          to: '/admin/accounts',
          color: 'bg-purple-100 dark:bg-purple-900/20'
      }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold text-[var(--color-on-background)]">
                管理後台總覽
            </h2>
            <p className="text-[var(--color-on-surface-variant)]">
                安全管理後台
            </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            {adminFeatures.map((feature) => (
                <Link key={feature.to} to={feature.to} className="block group">
                    <Card variant="elevated" className="h-full hover:scale-[1.01] transition-all duration-300 border-l-4 border-[var(--color-primary)]">
                        <div className="p-6 flex items-start gap-4">
                            <div className={`p-4 rounded-xl ${feature.color} transition-colors group-hover:bg-[var(--color-primary-container)]`}>
                                {feature.icon}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xl font-bold text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)] transition-colors">
                                        {feature.title}
                                    </h3>
                                    <ChevronRight className="w-5 h-5 text-[var(--color-outline)] group-hover:translate-x-1 transition-transform" />
                                </div>
                                <p className="text-[var(--color-on-surface-variant)] leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
    </div>
  );
}
