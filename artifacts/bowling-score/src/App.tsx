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
import MemberList from "@/pages/MemberList";
import ScoreEntry from "@/pages/ScoreEntry";
import Stats from "@/pages/Stats";
import Games from "@/pages/Games";
import MyPage from "@/pages/MyPage";
import NotFound from "@/pages/not-found";
import MigrationModal from "@/components/MigrationModal";
import TeamBuilder from "@/pages/TeamBuilder";
import ScoreComparison from "@/pages/ScoreComparison";

const queryClient = new QueryClient();

function AppRoutes({ onLogout, role, userName, accountId }: { onLogout: () => void; role: UserRole; userName: string; accountId: string | null }) {
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
    <AuthContext.Provider value={{ role, userName, accountId }}>
      <MigrationModal />
      <Layout onLogout={onLogout}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/stats" component={Stats} />
          <Route path="/games" component={Games} />
          <Route path="/members/:id">
            {(params) => <MemberDetail id={params.id} />}
          </Route>
          <Route path="/members">{isAdmin ? <Members /> : <Redirect to="/" />}</Route>
          <Route path="/score-entry">{isAdmin ? <ScoreEntry /> : <Redirect to="/" />}</Route>
          <Route path="/team-builder">{isAdmin ? <TeamBuilder /> : <Redirect to="/" />}</Route>
          <Route path="/score-comparison">{isAdmin ? <ScoreComparison /> : <Redirect to="/" />}</Route>
          <Route path="/member-list" component={MemberList} />
          <Route path="/mypage">{!isAdmin ? <MyPage /> : <Redirect to="/" />}</Route>
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </AuthContext.Provider>
  );
}

function AuthGuard() {
  const [authState, setAuthState] = useState<{ role: UserRole; userName: string; accountId: string | null } | null>(() => {
    const role = sessionStorage.getItem("bowling_auth_role") as UserRole | null;
    const userName = sessionStorage.getItem("bowling_auth_name") || "";
    const accountId = sessionStorage.getItem("bowling_auth_account_id") || null;
    return role ? { role, userName, accountId } : null;
  });

  if (!authState) {
    return (
      <Login
        onLogin={(role, userName, accountId) => {
          setAuthState({ role, userName, accountId: accountId ?? null });
        }}
      />
    );
  }

  const handleLogout = () => {
    sessionStorage.removeItem("bowling_auth_role");
    sessionStorage.removeItem("bowling_auth_name");
    sessionStorage.removeItem("bowling_auth_account_id");
    setAuthState(null);
  };

  return (
    <AppProvider>
      <AppRoutes onLogout={handleLogout} role={authState.role} userName={authState.userName} accountId={authState.accountId} />
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
