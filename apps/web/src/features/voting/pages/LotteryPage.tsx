import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../auth/services/auth.api";
import { API_ENDPOINTS } from "../../../lib/constants";
import { Card } from '../../../components/m3/Card';
import { type Election } from "@savote/shared-types";
import { Gift, Trophy } from "lucide-react";

interface LotteryResult {
    totalParticipants: number;
    drawCount: number;
    winners: string[];
}

export function LotteryPage() {
    const [selectedElectionId, setSelectedElectionId] = useState<string>("");
    const [result, setResult] = useState<LotteryResult | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // 撈取選舉清單
    const { data: elections = [] } = useQuery({
        queryKey: ["elections-lottery"],
        queryFn: async () => {
            const res = await api.get<Election[]>(API_ENDPOINTS.ELECTIONS.LIST);
            return res.data;
        },
    });

    async function handleDraw(){
        if (!selectedElectionId) return;
        setResult(null);
        setErrorMsg(null);

        try {
            const res = await api.get<LotteryResult>(`/elections/${selectedElectionId}/lottery`);
            setResult(res.data);

        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || "發生預期外的錯誤";
            setErrorMsg(`抽獎失敗：${msg}`);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            <div className="grid gap-8">
                {/* 控制面板 */}
                <Card className="p-8 rounded-2xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-low)] elevation-1">
                    <div className="flex flex-col md:flex-row md:items-end gap-6">

                        {/* 選擇選舉 */}
                        <div className="flex-1 space-y-3">
                            <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-on-surface-variant)] px-1">
                                <Gift className="w-4 h-4 text-[var(--color-primary)]" />
                                選擇抽獎目標案件
                            </label>
                            <div className="relative group">
                                <select
                                    className="w-full appearance-none rounded-xl bg-[var(--color-surface-container-high)] border-2 border-transparent focus:border-[var(--color-primary)]/30 text-[var(--color-on-surface)] px-6 py-4 focus:outline-none transition-all cursor-pointer font-bold text-lg"
                                    value={selectedElectionId}
                                    onChange={(e) => {
                                        
                                        setSelectedElectionId(e.target.value);
                                        setResult(null); // 切換選舉時清空結果
                                        setErrorMsg(null);
                                        handleDraw();
                                    }}
                                >
                                    <option value="">請選擇選舉...</option>
                                    {elections.map((election) => (
                                        <option key={election.id} value={election.id}>
                                            {election.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </Card>

                {errorMsg && (
                    <div className="animate-fade-in flex items-center gap-3 p-4 bg-[var(--color-error-container)]/20 border border-[var(--color-error)]/30 rounded-xl">
                        <div className="p-2 bg-[var(--color-error)]/10 rounded-lg">
                            <svg className="w-5 h-5 text-[var(--color-error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-sm font-bold text-[var(--color-error)]">{errorMsg}</p>
                    </div>
                )}
                {/* 抽獎結果顯示區塊 */}
                {result && (
                    <Card className="p-12 rounded-3xl border border-[var(--color-primary)]/30 bg-[var(--color-primary-container)]/10 elevation-2 animate-slide-up text-center overflow-hidden relative">
                        <Trophy className="absolute top-0 right-0 w-64 h-64 text-[var(--color-primary)] opacity-5 -mr-12 -mt-12" />

                        <h2 className="text-3xl font-black text-[var(--color-primary)] mb-2 relative z-10">
                            抽獎結果
                        </h2>
                        <p className="text-[var(--color-on-surface-variant)] font-medium mb-12 relative z-10">
                            總共抽出抽出 {result.drawCount} 位幸運得主
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 relative z-10">
                            {result.winners.map((studentId, index) => (
                                <div
                                    key={index}
                                    className="bg-[var(--color-surface)] border-2 border-[var(--color-primary)]/20 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 elevation-1 hover:elevation-2 transition-all hover:-translate-y-1"
                                >
                                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] flex items-center justify-center font-black text-sm">
                                        #{index + 1}
                                    </div>
                                    <span className="text-2xl font-black tracking-widest text-[var(--color-on-surface)]">
                                        {studentId}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}