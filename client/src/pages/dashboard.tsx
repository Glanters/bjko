import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { AddStaffDialog } from "@/components/dashboard/add-staff-dialog";
import { StaffTable } from "@/components/dashboard/staff-table";
import { CurrentLeavePanel } from "@/components/dashboard/current-leave-panel";
import { AnimatedClock } from "@/components/dashboard/animated-clock";
import { useStaff } from "@/hooks/use-staff";
import { useLeaves } from "@/hooks/use-leaves";
import { Users, Coffee, UserCheck, Activity } from "lucide-react";

function StatsCards() {
  const { data: staffList } = useStaff();
  const { data: leaves } = useLeaves();

  const totalStaff = staffList?.length ?? 0;

  const localMidnight = new Date();
  localMidnight.setHours(0, 0, 0, 0);

  const activeLeaves = leaves?.filter(l =>
    !l.clockInTime && new Date(l.startTime) >= localMidnight
  ) ?? [];

  const sedangIzin = activeLeaves.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {/* Total Staff Aktif */}
      <div className="glass-panel rounded-2xl border border-white/10 p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">Total Member Aktif</p>
          <p className="text-3xl font-bold text-gradient">{totalStaff}</p>
          <p className="text-xs text-muted-foreground">Staff terdaftar</p>
        </div>
      </div>

      {/* Sedang Izin */}
      <div className="glass-panel rounded-2xl border border-amber-500/20 p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Coffee className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">Sedang Izin</p>
          <p className="text-3xl font-bold text-amber-400">{sedangIzin}</p>
          <p className="text-xs text-muted-foreground">Belum clock-in</p>
        </div>
      </div>

      {/* Sudah Clock-In */}
      <div className="glass-panel rounded-2xl border border-emerald-500/20 p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <UserCheck className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">Sudah Clock-In Hari Ini</p>
          <p className="text-3xl font-bold text-emerald-400">
            {leaves?.filter(l => l.clockInTime && new Date(l.startTime) >= localMidnight).length ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">Selesai izin</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 overflow-auto px-4 py-6 relative z-10">
          {/* Welcome */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-display font-bold text-gradient flex items-center gap-2">
                <Activity className="w-6 h-6 text-primary" />
                Monitoring Izin Staff
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Selamat datang, <span className="text-foreground font-semibold">{user.username.toUpperCase()}</span>
                {" · "}Pantau aktivitas izin staff secara real-time.
              </p>
            </div>
            {user.role === "admin" && <AddStaffDialog />}
          </div>

          {/* Stats */}
          <StatsCards />

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 order-2 lg:order-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold">Daftar Staff Aktif</h3>
              </div>
              <StaffTable />
            </div>
            <div className="lg:col-span-1 order-1 lg:order-2">
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
