import { AdminLoginPage } from './features/auth/pages/AdminLoginPage';
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { CallbackPage } from "./features/auth/pages/CallbackPage";
import { SetupPage } from "./features/auth/pages/SetupPage";
import { AuthError } from "./components/AuthError";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./features/auth/hooks/useAuth";
import { VoterManagementPage } from "./features/admin/pages/VoterManagementPage";
import { ElectionManagementPage } from "./features/admin/pages/ElectionManagementPage";
import { VotingBooth } from "./features/voting/pages/VotingBooth";
import { VoteSuccess } from "./features/voting/pages/VoteSuccess";
import { VerificationCenter } from "./features/verify/pages/VerificationCenter";
import { api } from "./features/auth/services/auth.api";
import { API_ENDPOINTS } from "./lib/constants";
import { type Election, ElectionStatus } from "@savote/shared-types";
import { PageShell } from "./components/layout/PageShell";
import { GlassCard } from "./components/ui/GlassCard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function HomePage() {
  const { user, logout } = useAuth();

  const { data: elections = [], isLoading } = useQuery({
    queryKey: ["elections"],
    queryFn: async () => {
      const response = await api.get<Election[]>(API_ENDPOINTS.ELECTIONS.LIST);
      return response.data;
    },
  });

  return (
    <PageShell>
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 flex items-center">
                <img
                  src="/sa_logo.png"
                  alt="學生會 Logo"
                  className="w-8 h-8 rounded-lg shadow-lg"
                />
                <h1 className="ml-3 text-xl font-bold text-white tracking-tight drop-shadow">
                  國立彰化師範大學 學生會投票系統
                </h1>
              </div>
              {user && (
                <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium glass-subtle text-blue-200">
                  {user.class}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <span className="text-sm text-gray-300 hidden sm:block">
                  Hi, {user.studentIdHash?.substring(0, 8)}...
                </span>
              )}
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 rounded-md text-white bg-red-600/90 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500/60 transition-all duration-200 shadow-sm"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            投票列表
          </h2>
          <p className="mt-2 text-sm text-gray-300">
            查看並參與當前正在進行的選舉活動。
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="spinner h-10 w-10 border-2 border-transparent rounded-full" />
          </div>
        ) : elections.length === 0 ? (
          <GlassCard>
            <div className="text-center py-10">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-white">暫無選舉</h3>
              <p className="mt-1 text-sm text-gray-300">
                目前沒有進行中的投票，請稍後再回來。
              </p>
            </div>
          </GlassCard>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger-fade-in">
            {elections.map((election) => (
              <GlassCard
                key={election.id}
                className="hover:glow-blue-border transition-all duration-300 hover:-translate-y-1"
              >
                <div className="">
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium glass-subtle ${
                        election.status === ElectionStatus.VOTING_OPEN
                          ? "text-green-300"
                          : election.status === ElectionStatus.VOTING_CLOSED
                            ? "text-gray-300"
                            : "text-yellow-300"
                      }`}
                    >
                      {election.status === ElectionStatus.VOTING_OPEN
                        ? "進行中"
                        : election.status}
                    </span>
                    <span className="text-xs text-gray-300">
                      {new Date(election.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3
                    className="text-lg font-medium text-white mb-2 line-clamp-1"
                    title={election.name}
                  >
                    {election.name}
                  </h3>
                  <p className="text-sm text-gray-300 mb-6 line-clamp-2">
                    請點擊下方按鈕進入投票頁面，行使您的權利。
                  </p>
                  <div className="flex flex-col gap-2">
                    {election.status === ElectionStatus.VOTING_OPEN && (
                      <Link
                        to={`/vote/${election.id}`}
                        className="w-full flex justify-center items-center px-4 py-2 text-sm font-medium rounded-md text-white glass-strong border border-blue-400/50 hover:border-blue-400/80 hover:bg-blue-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/30 backdrop-blur-xl"
                      >
                        進入投票
                      </Link>
                    )}
                    <Link
                      to={`/verify/${election.id}`}
                      className="w-full flex justify-center items-center px-4 py-2 text-sm font-medium rounded-md glass-subtle text-blue-200 hover:text-white transition-colors"
                      title={election.status === ElectionStatus.VOTING_OPEN ? "結果將在投票結束後開放" : "查看選舉結果與驗證資料"}
                    >
                      查看結果 / 驗證
                    </Link>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {user?.role === "ADMIN" && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">管理員專區</h2>
              <span className="px-3 py-1 glass-subtle text-blue-200 rounded-full text-xs font-semibold">
                Admin Access
              </span>
            </div>
            <GlassCard>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to="/admin/voters"
                  className="flex items-center p-4 glass-subtle rounded-lg hover:glow-blue-border transition-all group"
                >
                  <div className="p-3 bg-blue-500/20 rounded-full text-blue-300 group-hover:bg-blue-500/30 transition-colors">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-white">
                      選民資格管理
                    </h3>
                    <p className="text-sm text-gray-300">
                      匯入選民名單、管理投票資格
                    </p>
                  </div>
                </Link>
                <Link
                  to="/admin/elections"
                  className="flex items-center p-4 glass-subtle rounded-lg hover:glow-blue-border transition-all group"
                >
                  <div className="p-3 bg-green-500/20 rounded-full text-green-300 group-hover:bg-green-500/30 transition-colors">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-white">
                      選舉與候選人管理
                    </h3>
                    <p className="text-sm text-gray-300">
                      創建選舉、新增候選人、設定時程
                    </p>
                  </div>
                </Link>
              </div>
            </GlassCard>
          </section>
        )}
      </main>
    </PageShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/auth/login" element={<LoginPage />} />
                    <Route path="/auth/admin/login" element={<AdminLoginPage />} />
          <Route path="/auth/callback" element={<CallbackPage />} />
          <Route
            path="/auth/setup"
            element={
              <ProtectedRoute>
                <SetupPage />
              </ProtectedRoute>
            }
          />
          <Route path="/auth/error" element={<AuthError />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vote/:electionId"
            element={
              <ProtectedRoute>
                <VotingBooth />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vote/success"
            element={
              <ProtectedRoute>
                <VoteSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verify/:electionId"
            element={
              <ProtectedRoute>
                <VerificationCenter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/voters"
            element={
              <ProtectedRoute>
                <VoterManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/elections"
            element={
              <ProtectedRoute>
                <ElectionManagementPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
