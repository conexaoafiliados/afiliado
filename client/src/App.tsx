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
import Register from "./pages/Register";
import Login from "./pages/Login";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DashboardLayout from "./components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

function Protected({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

function withProtected(Page: () => React.JSX.Element) {
  return function ProtectedPage() {
    return (
      <Protected>
        <Page />
      </Protected>
    );
  };
}

const DashboardPage = withProtected(Dashboard);
const ProfileEditPage = withProtected(ProfileEdit);
const MissionsPage = withProtected(Missions);
const AchievementsPage = withProtected(Achievements);
const GrowthProgressPage = withProtected(GrowthProgress);
const CoursesPage = withProtected(Courses);
const ShopPage = withProtected(Shop);
const CommunityPage = withProtected(Community);
const AnalyticsPage = withProtected(Analytics);
const CheckoutPage = withProtected(Checkout);
const OrdersPage = withProtected(Orders);

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
      <Route path={"/cadastro"} component={Register} />
      <Route path={"/termos"} component={TermsOfService} />
      <Route path={"/privacidade"} component={PrivacyPolicy} />
      <Route path={"/dashboard"} component={DashboardPage} />
      <Route path={"/profile/edit"} component={ProfileEditPage} />
      <Route path={"/growth/missions"} component={MissionsPage} />
      <Route path={"/growth/achievements"} component={AchievementsPage} />
      <Route path={"/growth/progress"} component={GrowthProgressPage} />
      <Route path={"/courses/browse"} component={CoursesPage} />
      <Route path={"/shop/browse"} component={ShopPage} />
      <Route path={"/community/feed"} component={CommunityPage} />
      <Route path={"/analytics/overview"} component={AnalyticsPage} />
      <Route path={"/checkout"} component={CheckoutPage} />
      <Route path={"/orders"} component={OrdersPage} />
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
