import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../../../components/Layout";
import { AnimatedBackground } from "../../../components/AnimatedBackground";
import { GlowOrbs } from "../../../components/GlowOrbs";
import { api } from "../services/auth.api";
import { API_ENDPOINTS } from "../../../lib/constants";
import { EnrollmentStatus, UserRole } from "@savote/shared-types";

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
      role: UserRole;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("請輸入帳號和密碼");
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

        // Redirect to home
        navigate("/", { replace: true });
      } else {
        setError(response.data.error?.message || "登入失敗，請檢查帳號密碼");
      }
    } catch (err: any) {
      console.error("Admin login error:", err);
      console.error("Error response:", err.response?.data);
      setError(err.response?.data?.error?.message || err.message || "登入失敗，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout showFooter={false}>
      <div className="relative flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <AnimatedBackground />
        <GlowOrbs />
        <div className="grid-background absolute inset-0 opacity-20" />

        <div className="relative z-10 w-full max-w-md px-4">
          <div
            className="glass rounded-3xl shadow-2xl p-8 relative overflow-hidden"
            style={{ animation: "fadeInUp 0.8s ease-out" }}
          >
            <div className="scan-line absolute top-0 left-0 right-0 h-1 rounded-t-3xl opacity-50" />

            <div className="text-center pb-6 pt-2 stagger-fade-in">
              <div className="mb-6">
                <img
                  src="/sa_logo.png"
                  alt="學生會 Logo"
                  className="w-20 h-20 mx-auto rounded-2xl shadow-lg"
                  style={{
                    animation:
                      "bounceIn 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                  }}
                />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                管理員登入
              </h2>
              <h3 className="text-xl font-semibold text-blue-200 mb-4">
                Admin Portal
              </h3>
              <p className="text-gray-300 text-sm">
                請使用管理員帳號和密碼登入
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 mt-8 stagger-fade-in"
            >
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  帳號 (Username)
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 glass-subtle rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:glow-blue-border transition-all"
                  placeholder="請輸入管理員帳號"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  密碼 (Password)
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 glass-subtle rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:glow-blue-border transition-all"
                  placeholder="請輸入密碼"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div
                  className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 glass-subtle"
                  style={{ animation: "fadeInUp 0.3s ease-out" }}
                >
                  <div className="flex items-center">
                    <svg
                      className="h-5 w-5 text-red-400 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !username.trim() || !password.trim()}
                className="w-full flex justify-center items-center px-5 py-3.5 rounded-xl text-sm font-medium text-white glass-strong border border-blue-400/50 hover:border-blue-400/80 hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/30 backdrop-blur-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    登入中...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                    登入 (Sign In)
                  </>
                )}
              </button>
            </form>

            <div className="pt-6 border-t border-white/10 mt-6">
              <button
                type="button"
                onClick={() => navigate("/auth/login")}
                className="w-full flex justify-center items-center py-3 px-4 glass-subtle rounded-xl text-sm font-medium text-gray-300 hover:text-white focus:outline-none transition-all"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                返回一般登入
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
