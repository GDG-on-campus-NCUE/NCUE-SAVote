import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../auth/services/auth.api';
import { API_ENDPOINTS } from '../../../lib/constants';
import { type Election, ElectionStatus } from '@savote/shared-types';
import { PageShell } from '../../../components/layout/PageShell';
import { GlassCard } from '../../../components/ui/GlassCard';

interface Tally {
  [candidateId: string]: number;
}

interface AuditLog {
  id: string;
  nullifier: string;
  proof: any;
  publicSignals: string[];
  createdAt: string;
}

export function VerificationCenter() {
  const { electionId } = useParams<{ electionId: string }>();

  const { data: election, isLoading: isLoadingElection } = useQuery({
    queryKey: ['election', electionId],
    queryFn: async () => {
      const response = await api.get<Election>(API_ENDPOINTS.ELECTIONS.GET(electionId!));
      return response.data;
    },
    enabled: !!electionId,
  });

  // Check if results are available (only after election is closed)
  const canViewResults = election?.status === ElectionStatus.VOTING_CLOSED || election?.status === ElectionStatus.TALLIED;

  const { data: tally, isLoading: isLoadingTally } = useQuery({
    queryKey: ['tally', electionId],
    queryFn: async () => {
      const response = await api.get<Tally>(API_ENDPOINTS.VOTES.TALLY(electionId!));
      return response.data;
    },
    enabled: !!electionId && canViewResults,
    retry: false,
  });

  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['logs', electionId],
    queryFn: async () => {
      const response = await api.get<AuditLog[]>(API_ENDPOINTS.VOTES.LOGS(electionId!));
      return response.data;
    },
    enabled: !!electionId && canViewResults,
    retry: false,
  });

  if (isLoadingElection || isLoadingTally || isLoadingLogs) {
    return (
      <PageShell>
        <div className="min-h-[60vh] flex justify-center items-center">
          <div className="spinner h-12 w-12" />
        </div>
      </PageShell>
    );
  }

  if (!election) {
    return (
      <PageShell>
        <div className="px-6 py-10 text-center">
          <h2 className="text-white text-xl font-semibold mb-2">Election not found</h2>
          <Link to="/" className="text-blue-300 hover:text-white">Back to Home</Link>
        </div>
      </PageShell>
    );
  }

  const totalVotes = Object.values(tally || {}).reduce((a, b) => a + b, 0);

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6">
          <Link to="/" className="text-blue-200 hover:text-white inline-flex items-center mb-3">← Back to Home</Link>
          <h1 className="text-3xl font-bold text-white">Verification Center</h1>
          <p className="text-gray-300">Election: {election.name}</p>
        </header>

        {!canViewResults && (
          <GlassCard className="mb-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-500/20 mb-4">
                <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">結果尚未開放</h3>
              <p className="text-gray-300 mb-4">
                此選舉的結果和驗證資料將在管理員設定為投票截止後開放查看。
              </p>
              <div className="inline-flex items-center px-3 py-1 glass-subtle rounded-full text-sm">
                <span className="text-gray-300">目前狀態：</span>
                <span className={`ml-2 font-medium ${
                  election.status === ElectionStatus.VOTING_OPEN ? 'text-green-300' : 'text-yellow-300'
                }`}>
                  {election.status === ElectionStatus.VOTING_OPEN ? '投票進行中' : election.status}
                </span>
              </div>
            </div>
          </GlassCard>
        )}

        {canViewResults && <div className="grid gap-6 md:grid-cols-2">
          {/* Results Section */}
          <GlassCard>
            <h2 className="text-xl font-semibold text-white mb-6">Election Results</h2>
            <div className="mb-4">
              <p className="text-blue-200 font-medium">Total Votes: {totalVotes}</p>
            </div>
            <div className="grid gap-3">
              {election.candidates.map(candidate => {
                const votes = tally?.[candidate.id] || 0;
                const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                return (
                  <div key={candidate.id} className="glass-subtle border border-white/10 p-4 rounded-lg">
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="text-white/90 font-medium">{candidate.name}</span>
                      <span className="text-blue-200 font-semibold">{votes} votes ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-[width] duration-500" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Audit Logs Section */}
          <GlassCard>
            <h2 className="text-xl font-semibold text-white mb-3">Audit Logs</h2>
            <p className="text-gray-300 mb-4 text-sm">
              These are the raw Zero-Knowledge Proofs submitted. Anyone can verify mathematically without revealing the voter's identity.
            </p>
            <div className="max-h-[600px] overflow-y-auto grid gap-3 pr-1">
              {logs?.map((log, index) => (
                <div key={log.id} className="glass-subtle border border-white/10 p-3 rounded-lg text-sm">
                  <div className="flex justify-between mb-2 text-gray-300">
                    <span>Vote #{index + 1}</span>
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="mb-2">
                    <span className="font-medium text-white">Nullifier Hash:</span>
                    <code className="block break-all bg-white/5 p-2 rounded mt-1 text-gray-200">
                      {log.nullifier}
                    </code>
                  </div>
                  <details>
                    <summary className="cursor-pointer text-blue-300 hover:text-white font-medium">View Proof Data</summary>
                    <pre className="mt-2 p-2 bg-white/5 rounded overflow-x-auto text-xs text-gray-100">
                      {JSON.stringify(log.proof, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
              {logs?.length === 0 && (
                <p className="text-gray-300 text-center">No votes cast yet.</p>
              )}
            </div>
          </GlassCard>
        </div>}
      </div>
    </PageShell>
  );
}
