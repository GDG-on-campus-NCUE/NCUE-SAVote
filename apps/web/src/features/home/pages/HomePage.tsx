import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../auth/services/auth.api';
import { API_ENDPOINTS } from '../../../lib/constants';
import { type Election, ElectionStatus } from '@savote/shared-types';
import { Card } from '../../../components/m3/Card';
import { Button } from '../../../components/m3/Button';
import { Calendar, CheckCircle2, AlertCircle, Vote } from 'lucide-react';

export const HomePage = () => {
    const { data: elections = [], isLoading } = useQuery({
        queryKey: ["elections"],
        queryFn: async () => {
            const response = await api.get<Election[]>(API_ENDPOINTS.ELECTIONS.LIST);
            return response.data;
        },
    });

    const getStatusColor = (status: ElectionStatus) => {
        switch (status) {
            case ElectionStatus.VOTING_OPEN: return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
            case ElectionStatus.VOTING_CLOSED: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
            default: return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
        }
    };

    const getStatusText = (status: ElectionStatus) => {
        switch (status) {
            case ElectionStatus.DRAFT: return '草稿';
            case ElectionStatus.REGISTRATION_OPEN: return '報名中';
            case ElectionStatus.VOTING_OPEN: return '投票中';
            case ElectionStatus.VOTING_CLOSED: return '已結束';
            case ElectionStatus.TALLIED: return '已計票';
            default: return status;
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold text-[var(--color-on-background)]">
                    選舉列表
                </h2>
                <p className="text-[var(--color-on-surface-variant)]">
                    查看並參與進行中的選舉。
                </p>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
                </div>
            ) : elections.length === 0 ? (
                <Card className="p-10 text-center flex flex-col items-center gap-4">
                    <AlertCircle className="w-12 h-12 text-[var(--color-outline)]" />
                    <h3 className="text-lg font-medium">找不到選舉</h3>
                    <p className="text-[var(--color-on-surface-variant)]">
                        請稍後再試。
                    </p>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {elections.map((election) => (
                        <Card key={election.id} variant="elevated" className="flex flex-col h-full hover:scale-[1.01] transition-transform duration-300">
                            <div className="h-32 bg-gradient-to-br from-[var(--color-primary-container)] to-[var(--color-tertiary-container)] relative overflow-hidden">
                                <div className="absolute top-4 right-4">
                                     <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(election.status)}`}>
                                        {election.status === ElectionStatus.VOTING_OPEN && <span className="relative flex h-2 w-2 mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>}
                                        {getStatusText(election.status)}
                                     </span>
                                </div>
                            </div>
                            
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)] mb-2">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{new Date(election.createdAt).toLocaleDateString()}</span>
                                </div>
                                
                                <h3 className="text-xl font-bold mb-2 text-[var(--color-on-surface)] line-clamp-1" title={election.name}>
                                    {election.name}
                                </h3>
                                
                                <p className="text-sm text-[var(--color-on-surface-variant)] mb-6 line-clamp-2 flex-1">
                                    請點擊下方進入投票頁面。
                                </p>

                                <div className="flex flex-col gap-3 mt-auto">
                                    {election.status === ElectionStatus.VOTING_OPEN && (
                                        <Link to={`/vote/${election.id}`} className="w-full">
                                            <Button className="w-full" icon={<Vote className="w-4 h-4" />}>
                                                立即投票
                                            </Button>
                                        </Link>
                                    )}
                                    <Link to={`/verify/${election.id}`} className="w-full">
                                        <Button variant="tonal" className="w-full" icon={<CheckCircle2 className="w-4 h-4" />}>
                                            查看結果 / 驗證
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
