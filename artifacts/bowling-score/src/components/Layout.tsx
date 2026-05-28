import { useLocation } from "wouter";
import { LogOut, ShieldCheck, User, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export default function Layout({ children, onLogout }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const { role, userName } = useAuth();
  const isHome = location === "/";

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-black sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              {!isHome && (
                <button
                  onClick={() => window.history.back()}
                  className="flex items-center justify-center w-8 h-8 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setLocation("/")}
              className="hover:opacity-80 transition-opacity"
            >
              <img src="/logo.png" alt="팀 유니크" className="h-8 w-auto" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-white/60">
              {role === "admin" ? (
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              ) : (
                <User className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span className="font-medium text-white/90">{userName}</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1 text-sm text-white/50 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
