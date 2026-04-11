import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Card } from '../../../components/m3/Card';
import { 
    Vote, 
    Users, 
    Activity, 
    ShieldCheck, 
    ArrowUpRight
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
          description: '建立與管理各項選舉活動，設定投票起訖時間與候選人名單。',
          icon: <Vote className="w-7 h-7" />,
          to: '/admin/elections',
          stat: 'Active'
      },
      {
          title: '選舉人管理',
          description: '匯入符合資格的選舉人名冊，管理校園選舉人權限與狀態。',
          icon: <Users className="w-7 h-7" />,
          to: '/admin/voters',
          stat: 'Secure'
      },
      {
          title: '開票監控',
          description: '即時監控開票進度，查看選舉統計數據與最終結果。',
          icon: <Activity className="w-7 h-7" />,
          to: '/admin/monitoring',
          stat: 'Live'
      },
      {
          title: '權限管理',
          description: '管理後台管理員與超級管理員帳號權限與登入記錄。',
          icon: <ShieldCheck className="w-7 h-7" />,
          to: '/admin/accounts',
          stat: 'Admin Only'
      }
  ];

  return (
    <div className="space-y-10 py-6 animate-fade-in">
        <header className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
                <div className="h-8 w-1.5 bg-[var(--color-primary)] rounded-full" />
                <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--color-on-surface)] tracking-tight">
                    管理後台總覽
                </h2>
            </div>
            <p className="text-[var(--color-on-surface-variant)] font-medium opacity-70 ml-4">
                歡迎使用國立彰化師範大學學生會 去中心化投票系統，請透過以下選單進行操作。
            </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
            {adminFeatures.map((feature, index) => (
                <Link 
                    key={feature.to} 
                    to={feature.to} 
                    className="block group animate-slide-up"
                    style={{ animationDelay: `${index * 30}ms` }}
                >
                    <Card 
                        variant="elevated" 
                        className="h-full relative overflow-hidden border border-[var(--color-outline-variant)]/20 rounded-[32px] p-8 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:elevation-3"
                    >
                        {/* Subtle background decoration */}
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300">
                            <div className="scale-[3] transform rotate-12">
                                {feature.icon}
                            </div>
                        </div>

                        <div className="flex flex-col h-full relative z-10">
                            <div className="flex items-start justify-between mb-8">
                                <div className="p-4 rounded-2xl bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] elevation-1 group-hover:bg-[var(--color-primary)] group-hover:text-[var(--color-on-primary)] transition-colors duration-300">
                                    {feature.icon}
                                </div>
                                <span className="type-label-medium px-3 py-1 rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)]/30 group-hover:border-[var(--color-primary)]/30 transition-colors duration-300">
                                    {feature.stat}
                                </span>
                            </div>

                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-[var(--color-on-surface)] mb-3 group-hover:text-[var(--color-primary)] transition-colors duration-300">
                                    {feature.title}
                                </h3>
                                <p className="text-[var(--color-on-surface-variant)] leading-relaxed type-body-large opacity-80">
                                    {feature.description}
                                </p>
                            </div>

                            <div className="mt-8 flex items-center gap-2 text-[var(--color-primary)] font-bold text-sm tracking-wide group-hover:gap-3 transition-all duration-300">
                                進入管理介面
                                <ArrowUpRight className="w-4 h-4" />
                            </div>
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
    </div>
  );
}
