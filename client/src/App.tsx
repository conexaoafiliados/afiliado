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

function Router() {
  const { isAuthenticated, loading } = useAuth();

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
      {isAuthenticated && (
        <>
          <Route path={"/dashboard"} component={() => <DashboardLayout><Dashboard /></DashboardLayout>} />
          <Route path={"/profile/edit"} component={() => <DashboardLayout><ProfileEdit /></DashboardLayout>} />
          <Route path={"/growth/missions"} component={() => <DashboardLayout><Missions /></DashboardLayout>} />
          <Route path={"/growth/achievements"} component={() => <DashboardLayout><Achievements /></DashboardLayout>} />
          <Route path={"/growth/progress"} component={() => <DashboardLayout><GrowthProgress /></DashboardLayout>} />
          <Route path={"/courses/browse"} component={() => <DashboardLayout><Courses /></DashboardLayout>} />
          <Route path={"/shop/browse"} component={() => <DashboardLayout><Shop /></DashboardLayout>} />
          <Route path={"/community/feed"} component={() => <DashboardLayout><Community /></DashboardLayout>} />
          <Route path={"/analytics/overview"} component={() => <DashboardLayout><Analytics /></DashboardLayout>} />
          <Route path={"/checkout"} component={() => <DashboardLayout><Checkout /></DashboardLayout>} />
          <Route path={"/orders"} component={() => <DashboardLayout><Orders /></DashboardLayout>} />
        </>
      )}
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
