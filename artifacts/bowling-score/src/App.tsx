import { useState } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/context/AppContext";
import { AuthContext, type UserRole } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Members from "@/pages/Members";
import MemberDetail from "@/pages/MemberDetail";
import ScoreEntry from "@/pages/ScoreEntry";
import Stats from "@/pages/Stats";
import Games from "@/pages/Games";
import NotFound from "@/pages/not-found";
import MigrationModal from "@/components/MigrationModal";

const queryClient = new QueryClient();

function AppRoutes({ onLogout, role, userName }: { onLogout: () => void; role: UserRole; userName: string }) {
  const { loading } = useApp();
  const isAdmin = role === "admin";

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ role, userName }}>
      <MigrationModal />
      <Layout onLogout={onLogout}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/stats" component={Stats} />
          <Route path="/games" component={Games} />
          <Route path="/members/:id">
            {(params) => <MemberDetail id={params.id} />}
          </Route>
          {isAdmin && <Route path="/members" component={Members} />}
          {isAdmin && <Route path="/score-entry" component={ScoreEntry} />}
          {/* Redirect non-admin access to home */}
          {!isAdmin && <Route path="/members"><Redirect to="/" /></Route>}
          {!isAdmin && <Route path="/score-entry"><Redirect to="/" /></Route>}
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </AuthContext.Provider>
  );
}

function AuthGuard() {
  const [authState, setAuthState] = useState<{ role: UserRole; userName: string } | null>(() => {
    const role = sessionStorage.getItem("bowling_auth_role") as UserRole | null;
    const userName = sessionStorage.getItem("bowling_auth_name") || "";
    return role ? { role, userName } : null;
  });

  if (!authState) {
    return (
      <Login
        onLogin={(role, userName) => {
          setAuthState({ role, userName });
        }}
      />
    );
  }

  const handleLogout = () => {
    sessionStorage.removeItem("bowling_auth_role");
    sessionStorage.removeItem("bowling_auth_name");
    setAuthState(null);
  };

  return (
    <AppProvider>
      <AppRoutes onLogout={handleLogout} role={authState.role} userName={authState.userName} />
    </AppProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthGuard />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
