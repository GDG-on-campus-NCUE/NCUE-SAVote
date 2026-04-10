// pages/PublicResultsPage.tsx
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../auth/services/auth.api";
import { TallyResultsBoard, AdminSummaryResponse } from '../../../components/TallyResultsBoard';
import { Card } from '../../../components/m3/Card';

export function PublicResultsPage() {
  // 從網址列取得 electionId，例如 /verify/:electionId
  const { electionId } = useParams<{ electionId: string }>();

  const { data: summary, error, isLoading } = useQuery<AdminSummaryResponse>({
    queryKey: ["public-results", electionId],
    queryFn: async () => {
      if (!electionId) throw new Error("No election ID");
      const res = await api.get<AdminSummaryResponse>(`/elections/${electionId}/results`);
      return res.data;
    },
    enabled: !!electionId,
    retry: false, // 如果是 403 就不重試
  });

  if (isLoading) return <div className="text-center p-12">載入計票結果中...</div>;

  // 處理尚未公佈結果的狀況 (403 Forbidden)
  if (error && (error as any).response?.status === 403) {
    return (
      <Card className="p-12 text-center text-[var(--color-error)] bg-[var(--color-error-container)]/10">
        <h2 className="text-2xl font-bold">結果尚未公告</h2>
        <p>目前仍在計票階段或尚未開放查詢，請耐心等候公告。</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-24 max-w-6xl mx-auto pt-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black mb-4">選舉結果公告</h1>
        <p className="text-[var(--color-on-surface-variant)]">感謝您的參與，以下為最終官方計票結果。</p>
      </div>

      {summary && summary.tally && (
         <TallyResultsBoard summary={summary} />
      )}
    </div>
  );
}