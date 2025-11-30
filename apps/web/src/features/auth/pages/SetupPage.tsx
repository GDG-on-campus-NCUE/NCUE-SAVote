import { NullifierSetup } from '../components/NullifierSetup';
import { Layout } from '../../../components/Layout';
import { Card } from '../../../components/ui/Card';

export const SetupPage = () => {
  return (
    <Layout showFooter={false}>
      <div className="flex justify-center items-center" style={{ minHeight: '60vh' }}>
        <Card style={{ width: '100%', maxWidth: '500px' }}>
          <div className="text-center" style={{ paddingBottom: 'var(--spacing-lg)' }}>
            <h2 style={{ 
              fontSize: 'var(--font-size-2xl)', 
              fontWeight: 'var(--font-weight-bold)',
              marginBottom: 'var(--spacing-sm)',
              color: 'var(--color-text-primary)'
            }}>
              設定匿名金鑰
            </h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              為了確保投票的匿名性，請保存您的專屬金鑰
            </p>
          </div>
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <NullifierSetup />
          </div>
        </Card>
      </div>
    </Layout>
  );
};
