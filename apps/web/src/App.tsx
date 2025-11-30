import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './features/auth/pages/LoginPage';
import { CallbackPage } from './features/auth/pages/CallbackPage';
import { SetupPage } from './features/auth/pages/SetupPage';
import { AuthError } from './components/AuthError';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './features/auth/hooks/useAuth';
import { VoterManagementPage } from './features/admin/pages/VoterManagementPage';

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

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', backgroundColor: '#f9fafb' }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#111827' }}>NCU ESA 投票系統</h1>
            {user && (<p style={{ margin: '0.5rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>歡迎，班級：{user.class}</p>)}
          </div>
          <button
            onClick={logout}
            style={{ padding: '0.625rem 1.25rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ef4444'}
          >登出</button>
        </header>

        <main style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>投票列表</h2>
          <p style={{ color: '#6b7280' }}>目前沒有進行中的投票，請稍後再回來。</p>

          {user?.isAdmin && (
            <section style={{
              marginTop: '2rem',
              padding: '1.25rem',
              background: '#f3f4f6',
              borderRadius: '0.75rem',
              border: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}>
              <div>
                <p style={{ margin: 0, color: '#2563eb', fontWeight: 600 }}>Admin</p>
                <h3 style={{ margin: '0.25rem 0', fontSize: '1.1rem', color: '#111827' }}>選舉資格管理</h3>
                <p style={{ margin: 0, color: '#6b7280' }}>上傳 CSV 並重建 Merkle Root，確保投票資格名單一致。</p>
              </div>
              <Link
                to="/admin/voters"
                style={{
                  padding: '0.85rem 1.25rem',
                  background: '#2563eb',
                  color: '#fff',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                前往管理
              </Link>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<CallbackPage />} />
          <Route path="/auth/setup" element={
            <ProtectedRoute>
              <SetupPage />
            </ProtectedRoute>
          } />
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
            path="/admin/voters"
            element={
              <ProtectedRoute>
                <VoterManagementPage />
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
