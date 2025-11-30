import { LoginButton } from "../components/LoginButton";
import { Layout } from "../../../components/Layout";
import { Card } from "../../../components/ui/Card";

export const LoginPage = () => {
  return (
    <Layout showFooter={false}>
      <div className="flex justify-center items-center" style={{ minHeight: '60vh' }}>
        <Card style={{ width: '100%', maxWidth: '400px' }}>
          <div className="text-center" style={{ paddingBottom: 'var(--spacing-lg)' }}>
            <h2 style={{ 
              fontSize: 'var(--font-size-2xl)', 
              fontWeight: 'var(--font-weight-bold)',
              marginBottom: 'var(--spacing-sm)',
              color: 'var(--color-text-primary)'
            }}>
              NCUESA 投票系統
            </h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              請使用學校 Portal 帳號登入
            </p>
          </div>
          <div style={{ marginTop: 'var(--spacing-xl)' }}>
            <LoginButton />
          </div>
        </Card>
      </div>
    </Layout>
  );
};
