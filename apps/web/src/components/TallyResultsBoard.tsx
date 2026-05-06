// components/TallyResultsBoard.tsx
import { BarChart3, Trophy, Users, PieChart, CheckCircle2 } from "lucide-react";
import { Card } from './m3/Card';
import type { Candidate } from "@savote/shared-types";

// 把你檔案最上面的 VoteServiceTally 介面搬過來，或者從 @savote/shared-types 引入
export interface VoteServiceTally {
  tally: Record<string, number>;
  totalVotes: number;
  blankVotes?: number;
  invalidVotes?: number;
  totalEligibleVoters: number;
  candidates: (Candidate & { voteCount: number })[];
  result: {
    winners?: Candidate[];
    winner?: Candidate; // 為了相容舊版
    threshold?: number;
    note?: string;
    isElected?: boolean;
  };
}

export interface AdminSummaryResponse {
  totalVotes: number;
  tally: VoteServiceTally;
  // election 屬性在這裡圖表用不到，所以可以忽略
}

interface Props {
  summary: AdminSummaryResponse;
}

// 幫助合併 className 的小工具
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export function TallyResultsBoard({ summary }: Props) {
  if (!summary || !summary.tally) return null;

  return (
    <div className="grid gap-8 md:grid-cols-12 animate-slide-up">
      {/* Statistics Sidebar */}
      <div className="md:col-span-4 space-y-6">
        <Card className="p-8 rounded-2xl bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] border-none elevation-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-[var(--color-on-primary-container)]/10 rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="type-title-large font-black uppercase tracking-widest">數據統計</h3>
          </div>

          <div className="space-y-8">
            <div className="flex flex-col">
              <span className="text-xs font-bold opacity-60 mb-1">總投票數</span>
              <div className="flex items-end justify-between">
                <span className="text-5xl font-black tracking-tighter tabular-nums leading-none">
                  {summary.totalVotes}
                </span>
                <span className="text-sm font-bold opacity-70 mb-1">票</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-[var(--color-on-primary-container)]/5 rounded-xl p-3 border border-[var(--color-on-primary-container)]/10 text-[var(--color-on-primary-container)]">
                <div className="text-[10px] font-black uppercase tracking-wider opacity-60 mb-1">廢票</div>
                <div className="text-xl font-black tabular-nums">{summary.tally.blankVotes || 0}</div>
              </div>

              <div className="bg-[var(--color-error-container)] rounded-xl p-3 border border-[var(--color-error)]/20 text-[var(--color-on-error-container)]">
                <div className="text-[10px] font-black uppercase tracking-wider opacity-80 mb-1">不合法票</div>
                <div className="text-xl font-black tabular-nums">{summary.tally.invalidVotes || 0}</div>
              </div>
            </div>

            <div className="flex flex-col border-t border-[var(--color-on-primary-container)]/10 pt-6">
              <span className="text-xs font-bold opacity-60 mb-1">合格選舉人數</span>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 opacity-60" />
                <span className="text-3xl font-black tabular-nums">
                  {summary.tally.totalEligibleVoters}
                </span>
              </div>
            </div>

            <div className="flex flex-col border-t border-[var(--color-on-primary-container)]/10 pt-6">
              <span className="text-xs font-bold opacity-60 mb-2">投票參與率</span>
              <div className="h-4 bg-[var(--color-on-primary-container)]/10 rounded-full overflow-hidden mb-2 border border-[var(--color-on-primary-container)]/10">
                <div
                  className="h-full bg-[var(--color-on-primary-container)] rounded-full transition-all duration-1000"
                  style={{ width: `${(summary.totalVotes / (summary.tally.totalEligibleVoters || 1)) * 100}%` }}
                />
              </div>
              <span className="text-sm font-black text-right opacity-80">
                {((summary.totalVotes / (summary.tally.totalEligibleVoters || 1)) * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </Card>

        {/* Result Card */}
        <Card className="p-8 rounded-2xl bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/30 elevation-1">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600 dark:text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h4 className="type-title-medium font-bold text-[var(--color-on-surface)]">勝選條件</h4>
              <p className="text-xs text-[var(--color-on-surface-variant)] opacity-70">依照「國立彰化師範大學學生會選舉罷免暨推舉自治條例」規定</p>
            </div>
          </div>
          <p className="text-lg font-bold text-[var(--color-on-surface)] leading-relaxed bg-[var(--color-surface-container-high)] p-4 rounded-xl border border-[var(--color-outline-variant)]/30">
            {summary.tally.result.note || '正在核對中...'}
          </p>
          {summary.tally.result.threshold && (
            <div className="mt-4 flex items-center justify-between px-2 text-xs font-bold text-[var(--color-on-surface-variant)]">
              <span>法定當選門檻</span>
              <span className="px-2 py-1 bg-[var(--color-surface-container-highest)] rounded-lg tabular-nums">
                {summary.tally.result.threshold} 票
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* Candidate Breakdown */}
      <div className="md:col-span-8">
        <Card className="p-8 rounded-2xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface)] elevation-1">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-[var(--color-on-surface)] flex items-center gap-3">
              <PieChart className="w-7 h-7 text-[var(--color-primary)]" />
              詳細計票數據
            </h2>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] font-bold text-xs border border-[var(--color-outline-variant)]/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              稽核完成
            </div>
          </div>

          {(!summary.tally.candidates || summary.tally.candidates.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--color-on-surface-variant)] opacity-40">
              <BarChart3 className="w-16 h-16 mb-4" />
              <p className="font-bold">尚無任何有效的計票資料</p>
            </div>
          ) : (
            <div className="space-y-6">
              {summary.tally.candidates
                .sort((a, b) => b.voteCount - a.voteCount)
                .map((candidate, index) => {
                  const count = candidate.voteCount;
                  const percentage = summary.totalVotes > 0 ? (count / summary.totalVotes) * 100 : 0;

                  const isWinner = summary.tally.result.winner?.id === candidate.id ||
                    summary.tally.result.winners?.some(w => w.id === candidate.id);

                  return (
                    <div
                      key={candidate.id}
                      className={cn(
                        "p-6 rounded-2xl border transition-all duration-500 relative group overflow-hidden",
                        isWinner
                          ? "bg-[var(--color-primary-container)]/10 border-[var(--color-primary)] elevation-2"
                          : "bg-[var(--color-surface-container-low)] border-transparent hover:bg-[var(--color-surface-container-high)]"
                      )}
                    >
                      {isWinner && (
                        <div className="absolute top-0 right-0 px-4 py-1 bg-[var(--color-primary)] text-[var(--color-on-primary)] font-black text-[10px] tracking-widest uppercase rounded-bl-lg elevation-2">
                          Winner
                        </div>
                      )}

                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="flex items-center gap-5">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black transition-all duration-500",
                            isWinner
                              ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] elevation-3 rotate-6"
                              : "bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface-variant)]"
                          )}>
                            {isWinner ? <Trophy className="w-6 h-6" /> : index + 1}
                          </div>
                          <div>
                            <span className={cn(
                              "text-xl font-black block mb-1",
                              isWinner ? "text-[var(--color-primary)]" : "text-[var(--color-on-surface)]"
                            )}>
                              {candidate.name}
                            </span>
                            <span className="text-xs font-medium text-[var(--color-on-surface-variant)] opacity-60">
                              {candidate.bio || '候選人描述尚無'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-[var(--color-on-surface)] tabular-nums leading-none">
                              {count}
                            </span>
                            <span className="text-sm font-bold opacity-50">票</span>
                          </div>
                          <span className="text-xs font-bold text-[var(--color-primary)] opacity-70 mt-1">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-4 bg-[var(--color-surface-container-highest)] rounded-full overflow-hidden border border-[var(--color-outline-variant)]/20">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-1000 ease-out",
                            isWinner ? "bg-[var(--color-primary)]" : "bg-[var(--color-secondary)] opacity-60"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                }
                )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
