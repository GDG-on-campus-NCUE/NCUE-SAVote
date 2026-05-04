import React, { useCallback } from "react";
import { useNavigate, Link, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { Navigation, NavItem } from "../m3/Navigation";
import { ThemeToggle } from "../m3/ThemeToggle";
import {
  Home,
  Settings,
  LogOut,
  //BookOpen,
  LockKeyhole,
  LayoutDashboard,
  User,
  Activity,
  SlidersHorizontal,
  Coins
} from "lucide-react";
import { Button } from "../m3/Button";
import { InstallPrompt } from "../InstallPrompt";
import { UserRole } from "@savote/shared-types";
import { useToastStore } from "../../stores/toastStore";
import { useLocation } from "react-router-dom";

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);

  // In your component
  const location = useLocation();

  // Check if the current path is under the admin section
  const isAdminRoute = location.pathname.startsWith('/admin');

  const isAdmin =
    user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      // Use requestAnimationFrame or a very short timeout to ensure unmounting cycle is clear
      requestAnimationFrame(() => {
        navigate("/auth/login", { replace: true });
      });
    } catch (error) {
      addToast("登出時發生錯誤", "error");
    }
  }, [logout, navigate, addToast]);

  const handleNavClick = (requiredRole?: UserRole) => {
    if (requiredRole === UserRole.SUPER_ADMIN && !isSuperAdmin) {
      addToast("您無權限存取權限管理頁面", "warning");
      return true; // prevent navigation
    }
    return false;
  };

  const actualNavItems: NavItem[] = [];

  if (isAdmin && isAdminRoute) {
    actualNavItems.push({
      label: "後台總覽",
      icon: <LayoutDashboard className="w-6 h-6" strokeWidth={1.5} />,
      activeIcon: <LayoutDashboard className="w-6 h-6" strokeWidth={2.5} />,
      to: "/admin",
      end: true,
    });

    actualNavItems.push({
      label: "選舉管理",
      icon: <Settings className="w-6 h-6" strokeWidth={1.5} />,
      activeIcon: <Settings className="w-6 h-6" strokeWidth={2.5} />,
      to: "/admin/elections",
    });

    actualNavItems.push({
      label: "選舉人管理",
      icon: <User className="w-6 h-6" strokeWidth={1.5} />,
      activeIcon: <User className="w-6 h-6" strokeWidth={2.5} />,
      to: "/admin/voters",
    });

    actualNavItems.push({
      label: "開票監控",
      icon: <Activity className="w-6 h-6" strokeWidth={1.5} />,
      activeIcon: <Activity className="w-6 h-6" strokeWidth={2.5} />,
      to: "/admin/monitoring"
    });

    actualNavItems.push({
      label: '抽獎',
      icon: <Coins className="w-6 h-6" strokeWidth={1.5} />,
      activeIcon: <Coins className="w-6 h-6" strokeWidth={2.5} />,
      to: '/admin/lottery'
    });

    actualNavItems.push({
      label: "權限管理",
      icon: <LockKeyhole className="w-6 h-6" strokeWidth={1.5} />,
      activeIcon: <LockKeyhole className="w-6 h-6" strokeWidth={2.5} />,
      to: "/admin/accounts",
    });

    if (isSuperAdmin) {
      actualNavItems.push({
        label: "系統設定",
        icon: <SlidersHorizontal className="w-6 h-6" strokeWidth={1.5} />,
        activeIcon: <SlidersHorizontal className="w-6 h-6" strokeWidth={2.5} />,
        to: "/admin/settings",
      });
    }
  } else {
    actualNavItems.push({
      label: "首頁",
      icon: <Home className="w-6 h-6" strokeWidth={1.5} />,
      activeIcon: <Home className="w-6 h-6" strokeWidth={2.5} />,
      to: "/",
      end: true,
    });

    // actualNavItems.push({
    //   label: "系統說明",
    //   icon: <BookOpen className="w-6 h-6" strokeWidth={1.5} />,
    //   activeIcon: <BookOpen className="w-6 h-6" strokeWidth={2.5} />,
    //   to: "/info/guide",
    // });
  }

  const TopBar = () => (
    <header className="fixed top-0 left-0 right-0 h-20 bg-[var(--color-surface)]/80 backdrop-blur-xl z-40 border-b border-[var(--color-outline-variant)]/20 px-4 md:px-8 flex items-center justify-between transition-colors duration-500 md:pl-[104px]">
      <Link
        to={isAdmin ? "/admin" : "/"}
        className="flex items-center gap-4 animate-fade-in hover:opacity-80 transition-opacity"
      >
        <img
          src="/sa_logo.webp"
          alt="Logo"
          className="w-10 h-10 md:w-12 md:h-12 object-contain"
        />
        <div className="flex flex-col">
          <h1 className="text-base md:text-lg font-bold text-[var(--color-on-surface)] leading-tight tracking-tight">
            國立彰化師範大學學生會
          </h1>
          <span className="text-[10px] md:text-[11px] text-[var(--color-primary)] font-semibold tracking-[0.1em] uppercase opacity-90">
            NCUE Student Association
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-full bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/30">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-[var(--color-on-surface)]">
                {user.name || "User"}
              </span>
              <span className="text-[10px] text-[var(--color-on-surface-variant)] opacity-70">
                {user.role}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
        )}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="text"
            onClick={handleLogout}
            className="ml-1 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
            icon={<LogOut className="w-4 h-4" />}
          >
            <span className="hidden sm:inline text-xs font-bold">登出</span>
          </Button>
        </div>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-on-surface)] transition-colors duration-500 select-none overflow-x-hidden w-full">
      <Navigation
        items={actualNavItems}
        orientation="vertical"
        onItemClick={(to) => {
          if (to === "/admin/accounts" || to === "/admin/settings") {
            return handleNavClick(UserRole.SUPER_ADMIN);
          }
          return false;
        }}
      />
      <TopBar />

      <main className="pt-24 pb-28 md:pl-[80px] md:pb-12 px-4 md:px-12 max-w-7xl mx-auto min-h-screen relative z-10 animate-fade-in overflow-x-hidden w-full">
        {children || <Outlet />}
      </main>

      <Navigation
        items={actualNavItems}
        orientation="horizontal"
        onItemClick={(to) => {
          if (to === "/admin/accounts" || to === "/admin/settings") {
            return handleNavClick(UserRole.SUPER_ADMIN);
          }
          return false;
        }}
      />
      <InstallPrompt />
    </div>
  );
};
