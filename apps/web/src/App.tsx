import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./components/m3/ThemeProvider";
import { MainLayout } from "./components/layout/MainLayout";
import { InstallPrompt } from "./components/InstallPrompt";
import { AuthError } from "./components/AuthError";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Loader2 } from 'lucide-react';

// Eager load critical auth pages
import { LoginPage } from "./features/auth/pages/LoginPage";
import { CallbackPage } from "./features/auth/pages/CallbackPage";
import { AdminLoginPage } from './features/auth/pages/AdminLoginPage';

// Lazy load feature pages
const SetupPage = lazy(() => import("./features/auth/pages/SetupPage").then(module => ({ default: module.SetupPage })));
const HomePage = lazy(() => import("./features/home/pages/HomePage").then(module => ({ default: module.HomePage })));
const UserGuidePage = lazy(() => import("./features/info/pages/UserGuidePage").then(module => ({ default: module.UserGuidePage })));
const ElectionBulletinPage = lazy(() => import("./features/info/pages/ElectionBulletinPage").then(module => ({ default: module.ElectionBulletinPage })));

// Voting
const KeySetupPage = lazy(() => import("./features/voting/pages/KeySetupPage").then(module => ({ default: module.KeySetupPage })));
const VotingBooth = lazy(() => import("./features/voting/pages/VotingBooth").then(module => ({ default: module.VotingBooth })));
const VoteSuccess = lazy(() => import("./features/voting/pages/VoteSuccess").then(module => ({ default: module.VoteSuccess })));
const VerificationCenter = lazy(() => import("./features/verify/pages/VerificationCenter").then(module => ({ default: module.VerificationCenter })));

// Admin
const AdminDashboardPage = lazy(() => import("./features/admin/pages/AdminDashboardPage").then(module => ({ default: module.AdminDashboardPage })));
const VoterManagementPage = lazy(() => import("./features/admin/pages/VoterManagementPage").then(module => ({ default: module.VoterManagementPage })));
const ElectionManagementPage = lazy(() => import("./features/admin/pages/ElectionManagementPage").then(module => ({ default: module.ElectionManagementPage })));
const CandidateManagementPage = lazy(() => import("./features/admin/pages/CandidateManagementPage").then(module => ({ default: module.CandidateManagementPage })));
const AdminMonitoringPage = lazy(() => import("./features/admin/pages/AdminMonitoringPage").then(module => ({ default: module.AdminMonitoringPage })));
const AdminAccountManagementPage = lazy(() => import("./features/admin/pages/AdminAccountManagementPage").then(module => ({ default: module.AdminAccountManagementPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[var(--color-background)]">
    <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <InstallPrompt />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Auth Routes */}
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/admin/login" element={<AdminLoginPage />} />
              <Route path="/auth/callback" element={<CallbackPage />} />
              <Route path="/auth/error" element={<AuthError />} />
              
              <Route
                path="/auth/setup"
                element={
                  <ProtectedRoute>
                    <SetupPage />
                  </ProtectedRoute>
                }
              />

              {/* Public Info */}
              <Route
                path="/info/bulletin"
                element={<ElectionBulletinPage />}
              />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <HomePage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Voting Process */}
              <Route
                path="/elections/:electionId/setup-key"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <KeySetupPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vote/:electionId"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <VotingBooth />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vote/success"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <VoteSuccess />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/verify/:electionId"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <VerificationCenter />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/info/guide"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <UserGuidePage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AdminDashboardPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/voters"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <VoterManagementPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/elections"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ElectionManagementPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/elections/:electionId/candidates"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <CandidateManagementPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/monitoring"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AdminMonitoringPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/accounts"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <AdminAccountManagementPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
