import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { AddStaffDialog } from "@/components/dashboard/add-staff-dialog";
import { StaffTable } from "@/components/dashboard/staff-table";
import { CurrentLeavePanel } from "@/components/dashboard/current-leave-panel";
import { AnimatedClock } from "@/components/dashboard/animated-clock";
import { ClipboardList } from "lucide-react";

export default function Izin() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 overflow-auto px-4 py-6 relative z-10">
          <div className="mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-display font-bold text-gradient flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-primary" />
                Izin Staff
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Monitor dan kelola izin staff secara real-time ·{" "}
                <span className="text-foreground font-semibold uppercase">{user.username}</span>
              </p>
            </div>
            <AddStaffDialog />
          </div>

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
