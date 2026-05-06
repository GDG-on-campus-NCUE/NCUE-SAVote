import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../auth/services/auth.api';
import { API_ENDPOINTS } from '../../../lib/constants';
import { type Election, ElectionType } from '@savote/shared-types';
import { Card } from '../../../components/m3/Card';
import { Button } from '../../../components/m3/Button';
import { AlertCircle, Vote, ChevronRight, Timer, Clock, Lock } from 'lucide-react';

export const ELECTION_TYPE_LABELS: Record<string, string> = {
    [ElectionType.PRESIDENTIAL]: '正副會長選舉',
    [ElectionType.DISTRICT_COUNCILOR]: '選區議員選舉',
    [ElectionType.AT_LARGE_COUNCILOR]: '不分區議員選舉',
};

export const HomePage = () => {
    const { data: elections = [], isLoading } = useQuery({
        queryKey: ["elections"],
        queryFn: async () => {
            const response = await api.get<Election[]>(API_ENDPOINTS.ELECTIONS.LIST);
            return response.data;
        },
    });

    const getStatusInfo = (election: Election) => {
        const now = new Date();
        const start = election.startTime ? new Date(election.startTime) : null;
        const end = election.endTime ? new Date(election.endTime) : null;

        if (!start || !end) return { label: '準備中', color: 'text-gray-500 bg-gray-100', icon: <Timer className="w-3 h-3" />, started: false };

        if (now < start) return { label: '即將開始', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', icon: <Timer className="w-3 h-3" />, started: false };
        if (now >= start && now <= end) return { label: '投票進行中', color: 'text-green-600 bg-green-50 dark:bg-green-900/20', icon: <Vote className="w-3 h-3" />, active: true, started: true, finished: false };
        return { label: '已結束', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', icon: <Timer className="w-3 h-3" />, started: true, finished: true };
    };

    return (
        <div className="space-y-10 pb-24 animate-fade-in select-none">
            <header className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1.5 bg-[var(--color-primary)] rounded-full" />
                    <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-on-surface)] tracking-tight">
                        選舉列表
                    </h2>
                </div>
                <p className="text-[var(--color-on-surface-variant)] font-medium opacity-70 ml-4 max-w-2xl">
                    歡迎參與校園民主！請在下方列表中選擇您感興趣的選舉項目，查看詳情或進行投票。
                </p>
            </header>

            {isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-72 bg-[var(--color-surface-container-low)] rounded-xl animate-pulse" />)}
                </div>
            ) : elections.length === 0 ? (
                <Card className="p-16 text-center flex flex-col items-center gap-6 rounded-xl bg-[var(--color-surface-container-low)] border-2 border-dashed border-[var(--color-outline-variant)] opacity-60">
                    <div className="p-6 rounded-full bg-[var(--color-surface-container-high)]">
                        <AlertCircle className="w-16 h-16 text-[var(--color-outline)]" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-[var(--color-on-surface)] mb-2">目前尚無進行中的選舉</h3>
                        <p className="text-[var(--color-on-surface-variant)] font-medium">請密切關注學生會公告，或稍後再回來查看。</p>
                    </div>
                </Card>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {elections.map((election) => {
                        const status = getStatusInfo(election);
                        const now = new Date();
                        const start = election.startTime ? new Date(election.startTime) : null;
                        const end = election.endTime ? new Date(election.endTime) : null;
                        const hasStarted = start && now >= start;

                        return (
                            <Card
                                key={election.id}
                                variant="elevated"
                                className="group flex flex-col h-full rounded-2xl overflow-hidden border border-[var(--color-outline-variant)]/20 hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] bg-[var(--color-surface)]"
                            >
                                {/* Card Header / Status */}
                                <div className="relative h-32 overflow-hidden bg-[var(--color-surface-container-high)]">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute top-5 left-6 flex flex-col gap-2">
                                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm ${status.color}`}>
                                            {status.active && (
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                </span>
                                            )}
                                            {status.icon}
                                            {status.label}
                                        </div>
                                        <div className="px-3 py-1 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-[9px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider w-fit">
                                            {ELECTION_TYPE_LABELS[election.type] || election.type}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-10 -right-10 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 transform group-hover:rotate-12 transition-transform">
                                        <Vote className="w-32 h-32" />
                                    </div>
                                </div>

                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.1em] text-[var(--color-primary)] uppercase mb-3">
                                        <Clock className="w-3 h-3" />
                                        <span>
                                            {hasStarted
                                                ? `結束時間：${end ? end.toLocaleString() : '-'}`
                                                : `開始時間：${start ? start.toLocaleString() : '-'}`
                                            }
                                        </span>
                                    </div>

                                    <h3 className="text-2xl font-bold mb-3 text-[var(--color-on-surface)] line-clamp-2 leading-tight group-hover:text-[var(--color-primary)] transition-colors" title={election.name}>
                                        {election.name}
                                    </h3>

                                    <div className="space-y-4 mb-8">
                                        <p className="text-sm text-[var(--color-on-surface-variant)] line-clamp-2 font-medium opacity-80 leading-relaxed">
                                            {(election as any).description || '點擊下方按鈕以參與投票或查看本屆選舉的詳細資訊與即時開票狀況。'}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3 mt-auto">
                                        {status.active ? (
                                            <Link to={`/vote/${election.id}`} className="w-full">
                                                <Button className="w-full h-14 rounded-xl font-bold shadow-lg shadow-[var(--color-primary)]/10 group-hover:gap-4 transition-all" icon={<Vote className="w-5 h-5" />}>
                                                    進入投票所
                                                </Button>
                                            </Link>
                                        ) : status.finished ? (
                                            <Button disabled className="w-full h-14 rounded-xl font-bold opacity-50 grayscale" icon={<Lock className="w-5 h-5" />}>
                                                投票結束
                                            </Button>
                                        ) : (
                                            <Button disabled className="w-full h-14 rounded-xl font-bold opacity-50 grayscale" icon={<Timer className="w-5 h-5" />}>
                                                尚未開放
                                            </Button>
                                        )}
                                        {status.started && (
                                            <Link to={`/${election.id}/results`} className="w-full">
                                                <Button variant="text" className="w-full h-12 rounded-xl font-bold hover:bg-[var(--color-primary)]/5" icon={<ChevronRight className="w-4 h-4" />}>
                                                    查看結果
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
