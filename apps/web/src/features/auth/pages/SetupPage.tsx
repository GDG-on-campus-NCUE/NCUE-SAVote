import { NullifierSetup } from '../components/NullifierSetup';
import { PageShell } from '../../../components/layout/PageShell';
import { GlassCard } from '../../../components/ui/GlassCard';

export const SetupPage = () => {
  return (
    <PageShell>
      <div className="flex justify-center items-center min-h-[60vh] px-4">
        <div className="w-full max-w-md">
          <GlassCard>
            <div className="text-center pb-6">
              <h2 className="text-2xl font-bold text-white mb-2">設定匿名金鑰</h2>
              <p className="text-gray-300">為了確保投票的匿名性，請保存您的專屬金鑰</p>
            </div>
            <div className="mt-4">
              <NullifierSetup />
            </div>
          </GlassCard>
        </div>
      </div>
    </PageShell>
  );
};
