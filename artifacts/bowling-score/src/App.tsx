import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/context/AppContext";
import Layout from "@/components/Layout";
import MigrationModal from "@/components/MigrationModal";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Members from "@/pages/Members";
import MemberDetail from "@/pages/MemberDetail";
import ScoreEntry from "@/pages/ScoreEntry";
import Stats from "@/pages/Stats";
import Games from "@/pages/Games";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function AppRoutes({ onLogout }: { onLogout: () => void }) {
  const { loading } = useApp();

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
    <>
      <MigrationModal />
      <Layout onLogout={onLogout}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/members" component={Members} />
          <Route path="/members/:id">
            {(params) => <MemberDetail id={params.id} />}
          </Route>
          <Route path="/score-entry" component={ScoreEntry} />
          <Route path="/stats" component={Stats} />
          <Route path="/games" component={Games} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </>
  );
}

function AuthGuard() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem("bowling_auth") === "true"
  );

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />;
  }

  const handleLogout = () => {
    sessionStorage.removeItem("bowling_auth");
    setAuthed(false);
  };

  return (
    <AppProvider>
      <AppRoutes onLogout={handleLogout} />
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
