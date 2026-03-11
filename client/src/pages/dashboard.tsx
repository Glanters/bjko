import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { AddStaffDialog } from "@/components/dashboard/add-staff-dialog";
import { StaffTable } from "@/components/dashboard/staff-table";
import { CurrentLeavePanel } from "@/components/dashboard/current-leave-panel";
import { AnimatedClock } from "@/components/dashboard/animated-clock";
import { useStaff } from "@/hooks/use-staff";
import { useLeaves } from "@/hooks/use-leaves";
import { Badge } from "@/components/ui/badge";
import { Users, Coffee, UserCheck, Activity } from "lucide-react";

function WelcomeBanner() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="glass-panel rounded-2xl border border-white/10 px-6 py-4 flex items-center gap-4 mb-6">
      <span className="text-2xl">👋</span>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-base font-semibold text-foreground">
          Welcome,{" "}
          <span className="font-bold text-gradient uppercase">{user.username}</span>
        </span>
        <Badge
          variant="outline"
          className="uppercase text-xs font-bold tracking-wide border-primary/40 text-primary bg-primary/10"
          data-testid="badge-role"
        >
          {user.role}
        </Badge>
      </div>
    </div>
  );
}

function StatsCards() {
  const { data: staffList } = useStaff();
  const { data: leaves } = useLeaves();

  const totalStaff = staffList?.length ?? 0;
  const agentCount = staffList?.filter(s => s.role === "agent").length ?? 0;

  const todayUtc = new Date().toISOString().split('T')[0];

  const sedangCuti = leaves?.filter(l =>
    !l.clockInTime && l.date === todayUtc
  ).length ?? 0;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {/* Total Users */}
      <div className="glass-panel rounded-2xl border border-white/10 p-4 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center mb-2">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <p className="text-xs font-semibold text-muted-foreground">Total Users</p>
        <p className="text-2xl font-bold text-gradient mt-1">{totalStaff}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{totalStaff} Users</p>
      </div>

      {/* Agent */}
      <div className="glass-panel rounded-2xl border border-blue-500/20 p-4 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/20 flex items-center justify-center mb-2">
          <UserCheck className="w-5 h-5 text-blue-400" />
        </div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Agent</p>
        <p className="text-2xl font-bold text-blue-400 mt-1">{agentCount}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{agentCount} Users</p>
        <p className="text-[10px] text-muted-foreground">Kategori Role Aktif</p>
      </div>

      {/* Sedang Cuti */}
      <div className="glass-panel rounded-2xl border border-amber-500/20 p-4 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/20 flex items-center justify-center mb-2">
          <Coffee className="w-5 h-5 text-amber-400" />
        </div>
        <p className="text-xs font-semibold text-muted-foreground">Sedang Cuti</p>
        <p className="text-2xl font-bold text-amber-400 mt-1">{sedangCuti}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{sedangCuti} Users</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 overflow-auto px-4 py-6 relative z-10">

          {/* Page title */}
          <div className="mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-display font-bold text-gradient flex items-center gap-2">
                <Activity className="w-6 h-6 text-primary" />
                Dashboard operasional BOSJOKO
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Selamat datang,{" "}
                <span className="text-foreground font-semibold">{user.username.toUpperCase()}</span>
                {" · "}Pantau aktivitas izin staff secara real-time.
              </p>
            </div>
            {user.role === "admin" && <AddStaffDialog />}
          </div>

          {/* Welcome banner */}
          <WelcomeBanner />

          {/* Stats cards — full width at top */}
          <StatsCards />

          {/* Staff table + clock panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold">Daftar Staff Aktif</h3>
              </div>
              <StaffTable />
            </div>
            <div className="lg:col-span-1">
              <div className="sticky top-6 flex flex-col gap-4">
                <AnimatedClock />
                <CurrentLeavePanel />
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
