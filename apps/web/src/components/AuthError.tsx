 import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Authentication Error Page
 * Displays error message from SAML SSO or other auth failures
 */
export function AuthError() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const errorMessage = searchParams.get('message') || '登入過程發生錯誤';

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      padding: '1rem',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{
        maxWidth: '28rem',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '2rem'
      }}>
        <div style={{
          width: '3rem',
          height: '3rem',
          backgroundColor: '#fee2e2',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem'
        }}>
          <svg 
            style={{ width: '1.5rem', height: '1.5rem', color: '#dc2626' }}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </div>

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '0.5rem',
          color: '#111827'
        }}>
          登入失敗
        </h2>

        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          marginBottom: '1.5rem'
        }}>
          {errorMessage}
        </p>

        <div style={{ 
          display: 'flex', 
          gap: '0.75rem',
          flexDirection: 'column'
        }}>
          <button
            onClick={() => navigate('/auth/login')}
            style={{
              width: '100%',
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.75rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            重新登入
          </button>

          <button
            onClick={() => navigate('/')}
            style={{
              width: '100%',
              backgroundColor: 'white',
              color: '#374151',
              padding: '0.75rem 1rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            返回首頁
          </button>
        </div>
      </div>
    </div>
  );
}
