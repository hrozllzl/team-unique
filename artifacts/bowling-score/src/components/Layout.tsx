import { useLocation } from "wouter";
import { Home, LogOut } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export default function Layout({ children, onLogout }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const isHome = location === "/";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => setLocation("/")}
            className="text-primary font-bold text-base hover:opacity-80 transition-opacity"
          >
            팀 유니크
          </button>
          <div className="flex items-center gap-3">
            {!isHome && (
              <button
                data-testid="button-home"
                onClick={() => setLocation("/")}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="w-4 h-4" />
                홈으로
              </button>
            )}
            <button
              data-testid="button-logout"
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
