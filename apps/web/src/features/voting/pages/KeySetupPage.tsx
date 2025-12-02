import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../../../components/Layout';
import { AnimatedBackground } from '../../../components/AnimatedBackground';
import { GlassCard, GlassButton, GlassInput } from '../../../components/ui';
import { generateNullifierSecret, nullifierToHex } from '../../auth/services/crypto.service';
import { votersApi } from '../services/voters.api';
// Lazy-load Poseidon to avoid blocking initial bundle
import { buildPoseidon } from 'circomlibjs';

const LOCAL_STORAGE_KEY = 'savote_nullifier_secret';

export const KeySetupPage: React.FC = () => {
  const { electionId } = useParams<{ electionId: string }>();
  // const navigate = useNavigate();
  const [secretHex, setSecretHex] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!electionId) return;

    const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (existing) {
      setSecretHex(existing);
      setInfo('已從瀏覽器載入既有金鑰，請檢查備份是否一致。若此裝置為新裝置，請確認有備份。');
    }
  }, [electionId]);

  const handleGenerate = () => {
    setError(null);
    setInfo(null);
    setIsGenerating(true);
    try {
      const bytes = generateNullifierSecret();
      const hex = nullifierToHex(bytes);
      setSecretHex(hex);
      localStorage.setItem(LOCAL_STORAGE_KEY, hex);
      setInfo('已生成新的金鑰並暫存於瀏覽器，請務必備份。');
    } catch (e) {
      setError('生成金鑰時發生錯誤，請稍後再試。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegister = async () => {
    setError(null);
    setInfo(null);
    if (!secretHex) {
      setError('尚未生成金鑰，請先點擊「生成金鑰」。若為新裝置，請輸入或貼上您備份的金鑰。');
      return;
    }
    if (!electionId) {
      setError('缺少選舉 ID。');
      return;
    }
    try {
      setIsRegistering(true);

      // 將十六進位金鑰轉回 bigint
      const normalized = secretHex.startsWith('0x') ? secretHex : `0x${secretHex}`;
      const secretBigInt = BigInt(normalized);

      // 使用 Poseidon(secret) 作為 identityCommitment
      const poseidon = await buildPoseidon();
      const commitmentBigInt = poseidon([secretBigInt]);
      const commitment = poseidon.F.toString(commitmentBigInt);

      await votersApi.registerCommitment(electionId, commitment);
      setIsRegistered(true);
      setInfo('金鑰已成功註冊，之後即可使用此金鑰進行匿名投票。');
    } catch (e: any) {
      setError(e?.response?.data?.message || '註冊金鑰時發生錯誤。');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Layout showFooter={false}>
      <div className="relative flex justify-center items-center min-h-screen overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10 w-full max-w-xl px-4 py-16">
          <GlassCard className="shadow-2xl text-white">
            <h1 className="text-2xl font-bold mb-2">匿名投票金鑰設置</h1>
            <p className="text-sm text-white/80 mb-6">
              本金鑰將用於生成零知識證明，系統只會記錄對應的承諾值 (Commitment)，
              不會儲存您的金鑰本身。請務必妥善備份，一旦遺失將無法找回。
            </p>

            <div className="space-y-4">
              <div>
                <GlassButton
                  type="button"
                  label={isGenerating ? '生成中…' : '生成新的金鑰'}
                  disabled={isGenerating}
                  onClick={handleGenerate}
                  className="w-full mb-3"
                />
                <GlassInput
                  readOnly
                  label="目前金鑰 (十六進位顯示，請勿外流)"
                  value={secretHex}
                  className="font-mono text-xs"
                  helperText="建議複製並離線保存，或下載成文字檔備份。"
                />
              </div>

              <div>
                <GlassInput
                  label="若在新裝置上，請貼上您備份的金鑰 (選填)"
                  placeholder="貼上先前備份的金鑰後即可覆蓋目前值"
                  value={secretHex}
                  onChange={(e) => {
                    setSecretHex(e.target.value.trim());
                    localStorage.setItem(LOCAL_STORAGE_KEY, e.target.value.trim());
                  }}
                  className="font-mono text-xs"
                  helperText="此步驟用於在新裝置上恢復既有金鑰，避免產生與原本不同的身分。"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <GlassButton
                  type="button"
                  label="將金鑰註冊至本次選舉"
                  onClick={handleRegister}
                  disabled={isRegistering}
                  className="flex-1"
                />
              </div>

              {info && <p className="text-xs text-emerald-300 mt-2">{info}</p>}
              {error && <p className="text-xs text-red-300 mt-2">{error}</p>}

              {isRegistered && (
                <p className="text-xs text-blue-200 mt-4">
                  ✅ 您的金鑰已綁定至本次選舉身分，之後在任何裝置上都應使用同一組金鑰進行投票，以確保唯一性與匿名性。
                </p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </Layout>
  );
};
