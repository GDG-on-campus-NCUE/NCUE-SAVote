import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatedBackground } from "../../../components/AnimatedBackground";
import { GlowOrbs } from "../../../components/GlowOrbs";
import { api } from "../services/auth.api";
import { API_ENDPOINTS } from "../../../lib/constants";
import { EnrollmentStatus, UserRole } from "@savote/shared-types";
import { Card } from "../../../components/m3/Card";
import { Button } from "../../../components/m3/Button";
import { TextField } from "../../../components/m3/TextField";
import { ThemeToggle } from "../../../components/m3/ThemeToggle";
import { LanguageSwitcher } from "../../../components/m3/LanguageSwitcher";
import { ArrowLeft, Lock, LogIn, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useThemeStore } from "../../../stores/themeStore";

interface AdminLoginResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      studentIdHash: string;
      class: string;
      email: string | null;
      name: string | null;
      ip?: string;
      role: UserRole;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export const AdminLoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { computedMode } = useThemeStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError(t('auth.error_missing_credentials', 'Please enter username and password'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post<AdminLoginResponse>(
        API_ENDPOINTS.AUTH.ADMIN_LOGIN,
        {
          username: username.trim(),
          password,
        }
      );

      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken, user } = response.data.data;

        // Import auth store dynamically to avoid circular dependency
        const { useAuthStore } = await import('../stores/authStore');
        const { setAuth, setNullifierSecretStatus } = useAuthStore.getState();

        // Create UserProfile with enrollmentStatus
        const userProfile = {
          ...user,
          enrollmentStatus: EnrollmentStatus.ACTIVE,
        };

        // Update auth store with user data
        setAuth(accessToken, refreshToken, userProfile);
        
        // Admin users don't need nullifier secret
        if (user.role === UserRole.ADMIN) {
          setNullifierSecretStatus(true);
        }

        // Redirect to admin dashboard
        navigate("/admin", { replace: true });
      } else {
        setError(response.data.error?.message || t('auth.login_failed', 'Login failed'));
      }
    } catch (err: any) {
      console.error("Admin login error:", err);
      setError(err.response?.data?.error?.message || err.message || t('auth.login_failed_retry', 'Login failed, please try again'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex justify-center items-center min-h-screen bg-[var(--color-background)] overflow-hidden transition-colors duration-300">
        {/* Background Effects */}
        {computedMode === 'dark' && (
            <div className="absolute inset-0 pointer-events-none">
                <AnimatedBackground />
                <GlowOrbs />
                <div className="grid-background absolute inset-0 opacity-20" />
            </div>
        )}

        {/* Top Right Controls */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
        </div>

        <div className="relative z-10 w-full max-w-md px-4 animate-fade-in">
          <Card variant="elevated" className="p-8 relative overflow-hidden backdrop-blur-sm bg-[var(--color-surface)]/90">
            {/* Top Decoration */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--color-primary)] opacity-80" />

            <div className="text-center pb-6 pt-2">
              <div className="mb-6 inline-block relative">
                <img
                  src="/sa_logo.png"
                  alt="Logo"
                  className="w-20 h-20 mx-auto rounded-2xl shadow-lg"
                />
                <div className="absolute -bottom-2 -right-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] p-1 rounded-full shadow-md">
                    <Lock className="w-4 h-4" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-[var(--color-on-surface)] mb-1">
                {t('auth.admin_login_title', 'Admin Login')}
              </h2>
              <p className="text-[var(--color-on-surface-variant)] text-sm">
                {t('auth.admin_login_subtitle', 'Secure Admin Portal')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <TextField
                  label={t('auth.username', 'Username')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  autoComplete="username"
              />

              <TextField
                  label={t('auth.password', 'Password')}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  endAdornment={
                    <button
                        type="button"
                        className="p-1 hover:text-[var(--color-on-surface)] transition-colors focus:outline-none"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
              />

              {error && (
                <div className="p-4 rounded-lg bg-[var(--color-error-container)] text-[var(--color-on-error-container)] flex items-center gap-3 animate-fade-in">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !username.trim() || !password.trim()}
                loading={isLoading}
                className="w-full"
                icon={<LogIn className="w-4 h-4" />}
              >
                {t('auth.sign_in', 'Sign In')}
              </Button>
            </form>

            <div className="pt-6 border-t border-[var(--color-outline-variant)] mt-6">
              <Button
                variant="text"
                onClick={() => navigate("/auth/login")}
                className="w-full"
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                {t('auth.back_to_login', 'Back to Login')}
              </Button>
            </div>
          </Card>
        </div>
    </div>
  );
};