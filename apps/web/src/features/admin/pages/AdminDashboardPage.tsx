import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../components/m3/Card';
import { 
    Vote, 
    Users, 
    Activity, 
    ShieldCheck, 
    ChevronRight 
} from 'lucide-react';

export function AdminDashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (user && user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  if (!user) return null;

  const adminFeatures = [
      {
          title: t('admin.election_mgmt'),
          description: t('admin.election_mgmt_desc'),
          icon: <Vote className="w-8 h-8 text-[var(--color-primary)]" />,
          to: '/admin/elections',
          color: 'bg-blue-100 dark:bg-blue-900/20'
      },
      {
          title: t('admin.voter_mgmt'),
          description: t('admin.voter_mgmt_desc'),
          icon: <Users className="w-8 h-8 text-[var(--color-primary)]" />,
          to: '/admin/voters',
          color: 'bg-green-100 dark:bg-green-900/20'
      },
      {
          title: t('admin.monitoring'),
          description: t('admin.monitoring_desc'),
          icon: <Activity className="w-8 h-8 text-[var(--color-primary)]" />,
          to: '/admin/monitoring',
          color: 'bg-orange-100 dark:bg-orange-900/20'
      },
      {
          title: t('admin.account_mgmt'),
          description: t('admin.account_mgmt_desc'),
          icon: <ShieldCheck className="w-8 h-8 text-[var(--color-primary)]" />,
          to: '/admin/accounts',
          color: 'bg-purple-100 dark:bg-purple-900/20'
      }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold text-[var(--color-on-background)]">
                {t('nav.admin_dashboard')}
            </h2>
            <p className="text-[var(--color-on-surface-variant)]">
                {t('auth.admin_login_subtitle')}
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