import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import RecentPage from "@/pages/recent-page";
import StarredPage from "@/pages/starred-page";
import SharedPage from "@/pages/shared-page";
import TrashPage from "@/pages/trash-page";
import TestPage from "@/pages/test-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "@/components/theme-provider";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/recent" component={RecentPage} />
      <ProtectedRoute path="/starred" component={StarredPage} />
      <ProtectedRoute path="/shared" component={SharedPage} />
      <ProtectedRoute path="/trash" component={TrashPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/test" component={TestPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="ui-theme">
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
