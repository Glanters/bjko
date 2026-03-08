import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { AddStaffDialog } from "@/components/dashboard/add-staff-dialog";
import { StaffTable } from "@/components/dashboard/staff-table";
import { LeaveChart } from "@/components/dashboard/leave-chart";
import { Activity } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null; // Let App.tsx handle redirect

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-display font-bold text-gradient flex items-center gap-2">
              <Activity className="w-8 h-8 text-primary" />
              Live Monitoring
            </h2>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Pantau aktivitas izin staff secara real-time. Setiap staff memiliki kuota izin maksimal 4 kali dalam sehari dengan durasi 15 menit.
            </p>
          </div>
          
          {user.role === 'admin' && (
            <AddStaffDialog />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-semibold">Daftar Staff Aktif</h3>
            </div>
            <StaffTable />
          </div>
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="sticky top-24">
              <LeaveChart />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
