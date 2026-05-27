import { useLocation } from "wouter";
import { Home } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
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
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
