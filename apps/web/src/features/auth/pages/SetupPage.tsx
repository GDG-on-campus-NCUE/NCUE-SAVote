import { NullifierSetup } from '../components/NullifierSetup';
import { Card } from '../../../components/m3/Card';
import { MainLayout } from '../../../components/layout/MainLayout';

export const SetupPage = () => {
  return (
    <MainLayout>
      <div className="flex justify-center items-center min-h-[80vh] px-4 animate-fade-in">
        <div className="w-full max-w-lg">
          <Card className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[var(--color-on-surface)] mb-2">
                  設定匿名投票金鑰
              </h2>
              <p className="text-[var(--color-on-surface-variant)]">
                  為了確保投票的匿名性，系統已為您產生了一個唯一的金鑰。請務必妥善保存。
              </p>
            </div>
            <NullifierSetup />
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};
