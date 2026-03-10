import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Izin from "@/pages/izin";
import Settings from "@/pages/settings";
import History from "@/pages/history";
import Analytics from "@/pages/analytics";
import AuditLog from "@/pages/audit-log";
import Backup from "@/pages/backup";
import LeaveRules from "@/pages/leave-rules";
import Profile from "@/pages/profile";
import Welcome from "@/pages/welcome";
import Jobdesk from "@/pages/jobdesk";
import Permissions from "@/pages/permissions";
import StaffCuti from "@/pages/staff-cuti";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;
  if (user.role !== "admin") return <Redirect to="/" />;
  return <Component />;
}

function AuthRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        {() => <AuthRoute component={Login} />}
      </Route>
      <Route path="/">
        {() => <ProtectedRoute component={Home} />}
      </Route>
      <Route path="/izin">
        {() => <ProtectedRoute component={Izin} />}
      </Route>
      <Route path="/history">
        {() => <ProtectedRoute component={History} />}
      </Route>
      <Route path="/settings">
        {() => <AdminRoute component={Settings} />}
      </Route>
      <Route path="/analytics">
        {() => <AdminRoute component={Analytics} />}
      </Route>
      <Route path="/audit-log">
        {() => <AdminRoute component={AuditLog} />}
      </Route>
      <Route path="/backup">
        {() => <AdminRoute component={Backup} />}
      </Route>
      <Route path="/leave-rules">
        {() => <AdminRoute component={LeaveRules} />}
      </Route>
      <Route path="/profile">
        {() => <ProtectedRoute component={Profile} />}
      </Route>
      <Route path="/welcome">
        {() => <ProtectedRoute component={Welcome} />}
      </Route>
      <Route path="/jobdesk">
        {() => <ProtectedRoute component={Jobdesk} />}
      </Route>
      <Route path="/permissions">
        {() => <AdminRoute component={Permissions} />}
      </Route>
      <Route path="/staff-cuti">
        {() => <ProtectedRoute component={StaffCuti} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <div className="dark">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
