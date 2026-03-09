import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  generateNullifierSecret,
  nullifierToHex,
  generateIdentityCommitment,
} from "../../auth/services/crypto.service";
import { votersApi } from "../services/voters.api";
import { useAuth } from "../../auth/hooks/useAuth";
import { Card } from "../../../components/m3/Card";
import { Button } from "../../../components/m3/Button";
import { TextField } from "../../../components/m3/TextField";
import {
  Key,
  Copy,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

const LOCAL_STORAGE_KEY = "savote_nullifier_secret";

export const KeySetupPage: React.FC = () => {
  const { electionId } = useParams<{ electionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const generatedRef = useRef(false);

  const [secretHex, setSecretHex] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Auto-generate key on mount if not exists
  useEffect(() => {
    if (!electionId || generatedRef.current) return;
    generatedRef.current = true;

    const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (existing) {
      setSecretHex(existing);
      setInfo("已從此裝置載入現有金鑰。");
    } else {
      try {
        const bytes = generateNullifierSecret();
        const hex = nullifierToHex(bytes);
        setSecretHex(hex);
        localStorage.setItem(LOCAL_STORAGE_KEY, hex);
        setInfo("已為此裝置產生新的安全金鑰。");
      } catch (e) {
        setError("產生金鑰時發生錯誤。");
      }
    }
  }, [electionId]);

  const handleRegister = async () => {
    setError(null);
    setInfo(null);
    if (!secretHex) {
      setError("找不到金鑰。");
      return;
    }
    if (!electionId) {
      setError("缺少選舉 ID。");
      return;
    }
    if (!user?.studentIdHash) {
      setError("驗證失敗，請重新登入。");
      return;
    }

    try {
      setIsRegistering(true);

      const normalizedSecret = secretHex.startsWith("0x")
        ? secretHex.slice(2)
        : secretHex;
      const normalizedStudentId = user.studentIdHash.startsWith("0x")
        ? user.studentIdHash.slice(2)
        : user.studentIdHash;

      // Generate commitment
      const commitment = await generateIdentityCommitment(
        normalizedStudentId,
        normalizedSecret,
      );

      await votersApi.registerCommitment(electionId, commitment);
      setIsRegistered(true);
      // Automatically redirect or show success
      setTimeout(() => {
        navigate(`/vote/${electionId}`);
      }, 1500);
    } catch (e: any) {
      // Check if already registered
      if (e?.response?.status === 409 || e?.message?.includes("already")) {
        setIsRegistered(true);
        setInfo("您已註冊，正在進入投票頁面...");
        setTimeout(() => {
          navigate(`/vote/${electionId}`);
        }, 1500);
      } else {
        setError(e?.response?.data?.message || "註冊金鑰時發生錯誤。");
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(secretHex);
    setInfo("金鑰已複製到剪貼簿。");
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 animate-fade-in pb-32">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] mb-6 shadow-lg shadow-[var(--color-primary)]/20 animate-scale-in">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold text-[var(--color-on-background)] tracking-tight">
          安全投票設定
        </h1>
        <p className="text-[var(--color-on-surface-variant)] mt-3 text-lg max-w-xl mx-auto leading-relaxed">
          我們正在為您建立安全且匿名的投票通道。這能確保您的選票不會被追溯到您的身份。
        </p>
      </div>

      <Card className="p-0 overflow-hidden border border-[var(--color-outline-variant)] shadow-xl bg-[var(--color-surface)]">
        <div className="p-8 space-y-8">
          {/* Key Display Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                <Key className="w-5 h-5 text-[var(--color-primary)]" />
                您的專屬投票金鑰
              </h2>
              <span className="px-2 py-1 rounded-md bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] text-xs font-bold uppercase">
                自動產生
              </span>
            </div>

            <div className="relative group">
              <TextField
                label=""
                value={secretHex}
                readOnly
                className="font-mono text-sm tracking-wide bg-[var(--color-surface-variant)]/30 border-[var(--color-outline)]"
              />
              <div className="absolute top-2 right-2">
                <Button
                  variant="tonal"
                  size="sm"
                  onClick={copyToClipboard}
                  icon={<Copy className="w-3.5 h-3.5" />}
                  className="h-8 text-xs"
                >
                  複製
                </Button>
              </div>
            </div>
            <p className="text-xs text-[var(--color-on-surface-variant)] flex items-start gap-2 bg-[var(--color-surface-container)] p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
              此金鑰保存在您的瀏覽器中。如果您更換裝置或清除資料，您將需要恢復此金鑰才能投票。
            </p>
          </div>

          <div className="h-px bg-[var(--color-outline-variant)]/50" />

          {/* Action Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-[var(--color-on-surface)]">
                註冊
              </h2>
              {isRegistered && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  已註冊
                </span>
              )}
            </div>

            <p className="text-sm text-[var(--color-on-surface-variant)]">
              點擊下方按鈕，您將在不洩露身份的情況下證明您的投票資格。
            </p>

            <Button
              onClick={handleRegister}
              loading={isRegistering}
              disabled={isRegistered || !secretHex}
              variant="filled"
              className="w-full h-12 text-base shadow-md hover:shadow-lg transition-all"
              icon={
                isRegistered ? (
                  <ArrowRight className="w-5 h-5" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )
              }
            >
              {isRegistered ? "繼續投票" : "註冊並繼續"}
            </Button>
          </div>
        </div>

        {/* Status Bar */}
        {(info || error) && (
          <div
            className={`px-8 py-3 flex items-center gap-3 border-t ${
              error
                ? "bg-[var(--color-error-container)] text-[var(--color-on-error-container)] border-[var(--color-error)]"
                : "bg-[var(--color-primary-container)]/30 text-[var(--color-on-surface)] border-[var(--color-outline-variant)]"
            }`}
          >
            {error ? (
              <AlertCircle className="w-5 h-5 shrink-0 text-[var(--color-error)]" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-[var(--color-primary)]" />
            )}
            <p className="text-sm font-medium">{error || info}</p>
          </div>
        )}
      </Card>
    </div>
  );
};
