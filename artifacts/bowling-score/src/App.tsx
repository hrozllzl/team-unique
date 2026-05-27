import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Members from "@/pages/Members";
import MemberDetail from "@/pages/MemberDetail";
import ScoreEntry from "@/pages/ScoreEntry";
import Stats from "@/pages/Stats";
import Games from "@/pages/Games";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

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
      <Layout onLogout={handleLogout}>
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
