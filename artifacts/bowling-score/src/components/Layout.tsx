import { useEffect } from "react";
import { useLocation } from "wouter";
import { LogOut, ShieldCheck, User, ArrowLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export default function Layout({ children, onLogout }: LayoutProps) {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const { role, userName } = useAuth();
  const isHome = location === "/";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              {!isHome && (
                <button
                  onClick={() => window.history.back()}
                  className="flex items-center justify-center w-8 h-8 rounded-xl hover:bg-gray-100 text-muted-foreground hover:text-foreground transition-colors"
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
            {role === "admin" ? (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                <span className="font-medium text-foreground">{userName}</span>
              </div>
            ) : (
              <button
                onClick={() => setLocation("/mypage")}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-blue-500 transition-colors group"
              >
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-medium text-foreground group-hover:text-blue-500 transition-colors">{userName}</span>
                <ChevronRight className="w-3 h-3 opacity-40 group-hover:opacity-80 transition-opacity" />
              </button>
            )}
            <button
              onClick={onLogout}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors"
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
