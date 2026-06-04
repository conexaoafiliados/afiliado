import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ProfileEdit from "./pages/ProfileEdit";
import Missions from "./pages/Missions";
import Achievements from "./pages/Achievements";
import GrowthProgress from "./pages/GrowthProgress";
import Courses from "./pages/Courses";
import Shop from "./pages/Shop";
import Community from "./pages/Community";
import Analytics from "./pages/Analytics";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

function Protected({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

function Router() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/dashboard"} component={() => <Protected><Dashboard /></Protected>} />
      <Route path={"/profile/edit"} component={() => <Protected><ProfileEdit /></Protected>} />
      <Route path={"/growth/missions"} component={() => <Protected><Missions /></Protected>} />
      <Route path={"/growth/achievements"} component={() => <Protected><Achievements /></Protected>} />
      <Route path={"/growth/progress"} component={() => <Protected><GrowthProgress /></Protected>} />
      <Route path={"/courses/browse"} component={() => <Protected><Courses /></Protected>} />
      <Route path={"/shop/browse"} component={() => <Protected><Shop /></Protected>} />
      <Route path={"/community/feed"} component={() => <Protected><Community /></Protected>} />
      <Route path={"/analytics/overview"} component={() => <Protected><Analytics /></Protected>} />
      <Route path={"/checkout"} component={() => <Protected><Checkout /></Protected>} />
      <Route path={"/orders"} component={() => <Protected><Orders /></Protected>} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
