import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./components/m3/ThemeProvider";
import { ToastContainer } from "./components/m3/ToastContainer";
import { MainLayout } from "./components/layout/MainLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { UserRole } from "@savote/shared-types";

// Lazy Pages
const LoginPage = lazy(() => import("./features/auth/pages/LoginPage").then(m => ({ default: m.LoginPage })));
const CallbackPage = lazy(() => import("./features/auth/pages/CallbackPage").then(m => ({ default: m.CallbackPage })));
const SetupPage = lazy(() => import("./features/auth/pages/SetupPage").then(m => ({ default: m.SetupPage })));
const HomePage = lazy(() => import("./features/home/pages/HomePage").then(m => ({ default: m.HomePage })));
const VotingBooth = lazy(() => import("./features/voting/pages/VotingBooth").then(m => ({ default: m.VotingBooth })));
const VoteSuccess = lazy(() => import("./features/voting/pages/VoteSuccess").then(m => ({ default: m.VoteSuccess })));
const KeySetupPage = lazy(() => import("./features/voting/pages/KeySetupPage").then(m => ({ default: m.KeySetupPage })));

const AdminDashboardPage = lazy(() => import("./features/admin/pages/AdminDashboardPage").then(m => ({ default: m.AdminDashboardPage })));
const ElectionManagementPage = lazy(() => import("./features/admin/pages/ElectionManagementPage").then(m => ({ default: m.ElectionManagementPage })));
const CandidateManagementPage = lazy(() => import("./features/admin/pages/CandidateManagementPage").then(m => ({ default: m.CandidateManagementPage })));
const AdminAccountManagementPage = lazy(() => import("./features/admin/pages/AdminAccountManagementPage").then(m => ({ default: m.AdminAccountManagementPage })));
const AdminSettingsPage = lazy(() => import("./features/admin/pages/AdminSettingsPage").then(m => ({ default: m.AdminSettingsPage })));
const AdminMonitoringPage = lazy(() => import("./features/admin/pages/AdminMonitoringPage").then(m => ({ default: m.AdminMonitoringPage })));
const VoterManagementPage = lazy(() => import("./features/admin/pages/VoterManagementPage").then(m => ({ default: m.VoterManagementPage })));
const ElectionBulletinPage = lazy(() => import("./features/info/pages/ElectionBulletinPage").then(m => ({ default: m.ElectionBulletinPage })));
const VerificationCenter = lazy(() => import("./features/verify/pages/VerificationCenter").then(m => ({ default: m.VerificationCenter })));

// Auth Error (Static import to ensure it shows up immediately on failure)
import { AuthError } from "./components/AuthError";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastContainer />
        <BrowserRouter>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[var(--color-surface)]" />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<CallbackPage />} />
              <Route path="/auth/error" element={<AuthError />} />
              <Route path="/info/bulletin" element={<ElectionBulletinPage />} />
              <Route path="/verify/:electionId" element={<VerificationCenter />} />

              {/* All Protected Routes with Persistent Layout */}
              <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                {/* Voter Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/vote/:electionId" element={<VotingBooth />} />
                <Route path="/vote/success" element={<VoteSuccess />} />
                <Route path="/vote/keys" element={<KeySetupPage />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}><AdminDashboardPage /></ProtectedRoute>} />
                <Route path="/admin/elections" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}><ElectionManagementPage /></ProtectedRoute>} />
                <Route path="/admin/elections/:electionId/candidates" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}><CandidateManagementPage /></ProtectedRoute>} />
                <Route path="/admin/voters" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}><VoterManagementPage /></ProtectedRoute>} />
                <Route path="/admin/monitoring" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}><AdminMonitoringPage /></ProtectedRoute>} />

                {/* Super Admin Routes */}
                <Route path="/admin/accounts" element={<ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}><AdminAccountManagementPage /></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}><AdminSettingsPage /></ProtectedRoute>} />
              </Route>

              {/* Standalone Protected Routes */}
              <Route path="/auth/setup" element={
                <ProtectedRoute>
                   <SetupPage />
                </ProtectedRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
