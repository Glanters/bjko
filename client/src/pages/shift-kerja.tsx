import { useState } from "react";
import { useStaff } from "@/hooks/use-staff";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Input } from "@/components/ui/input";
import { Sun, Sunset, Moon, Search, Users } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { Staff } from "@shared/schema";

const SHIFTS = [
  {
    key: "PAGI" as const,
    label: "Shift Pagi",
    icon: Sun,
    color: "amber",
    gradient: "from-amber-500/20 via-amber-400/10 to-transparent",
    border: "border-amber-500/30",
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    dot: "bg-amber-400",
    header: "text-amber-400",
    row: "hover:bg-amber-500/5",
  },
  {
    key: "SORE" as const,
    label: "Shift Sore",
    icon: Sunset,
    color: "orange",
    gradient: "from-orange-500/20 via-orange-400/10 to-transparent",
    border: "border-orange-500/30",
    badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    dot: "bg-orange-400",
    header: "text-orange-400",
    row: "hover:bg-orange-500/5",
  },
  {
    key: "MALAM" as const,
    label: "Shift Malam",
    icon: Moon,
    color: "blue",
    gradient: "from-blue-500/20 via-blue-400/10 to-transparent",
    border: "border-blue-500/30",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    dot: "bg-blue-400",
    header: "text-blue-400",
    row: "hover:bg-blue-500/5",
  },
];

export default function ShiftKerja() {
  const { user } = useAuth();
  const { data: staffList } = useStaff();
  const [search, setSearch] = useState("");

  const today = format(new Date(), "EEEE, dd MMM yyyy", { locale: localeId });

  const grouped = SHIFTS.map(shift => ({
    ...shift,
    staff: (staffList ?? []).filter(s => {
      const matchShift = s.shift === shift.key;
      const matchSearch = !search.trim() || s.name.toLowerCase().includes(search.toLowerCase()) || s.jobdesk.toLowerCase().includes(search.toLowerCase());
      return matchShift && matchSearch;
    }),
    total: (staffList ?? []).filter(s => s.shift === shift.key).length,
  }));

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 overflow-auto relative z-10">
          {/* Hero */}
          <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background border-b border-primary/20 px-6 py-8">
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Sun className="w-6 h-6 text-primary" />
                  <h1 className="text-3xl font-display font-black tracking-wider text-primary uppercase">
                    SHIFT KERJA
                  </h1>
                </div>
                <p className="text-muted-foreground text-sm">Daftar staff dikelompokkan per shift</p>
              </div>
              <p className="text-primary/80 font-semibold text-sm" data-testid="text-date">{today}</p>
            </div>
          </div>

          <div className="px-6 py-6 space-y-4">
            {/* Search */}
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau jobdesk..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-background/50 border-white/10 focus-visible:ring-primary/30 text-sm h-9"
                data-testid="input-search-shift"
              />
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              {grouped.map(shift => (
                <div
                  key={shift.key}
                  className={`glass-panel rounded-2xl border ${shift.border} p-4 flex items-center gap-4`}
                  data-testid={`card-summary-${shift.key.toLowerCase()}`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${shift.gradient} border ${shift.border} flex items-center justify-center shrink-0`}>
                    <shift.icon className={`w-5 h-5 ${shift.header}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider ${shift.header}`}>{shift.label}</p>
                    <p className="text-2xl font-black text-foreground">{shift.total}</p>
                    <p className="text-[11px] text-muted-foreground">staff terdaftar</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Shift sections */}
            <div className="grid grid-cols-1 gap-6">
              {grouped.map(shift => (
                <div
                  key={shift.key}
                  className={`glass-panel rounded-2xl border ${shift.border} overflow-hidden`}
                  data-testid={`section-shift-${shift.key.toLowerCase()}`}
                >
                  {/* Section header */}
                  <div className={`bg-gradient-to-r ${shift.gradient} px-6 py-4 border-b border-white/10 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${shift.dot} shadow-lg`} />
                      <shift.icon className={`w-4 h-4 ${shift.header}`} />
                      <span className={`font-black uppercase tracking-widest text-sm ${shift.header}`}>
                        {shift.label}
                      </span>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${shift.badge}`}>
                      {shift.total} Staff
                    </span>
                  </div>

                  {/* Column headers */}
                  <div className="grid grid-cols-[40px_1fr_1fr] px-6 py-2.5 border-b border-white/10 bg-white/[0.02]">
                    <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">#</span>
                    <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">Nama Staff</span>
                    <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">Jabatan / Jobdesk</span>
                  </div>

                  {/* Staff rows */}
                  {shift.staff.length === 0 ? (
                    <div className="px-6 py-10 text-center text-muted-foreground text-sm">
                      {search ? "Tidak ada staff yang cocok" : `Belum ada staff untuk ${shift.label}`}
                    </div>
                  ) : (
                    <div>
                      {shift.staff.map((s, i) => (
                        <div
                          key={s.id}
                          className={`grid grid-cols-[40px_1fr_1fr] items-center px-6 py-3 border-b border-white/5 transition-colors ${shift.row} ${
                            i % 2 === 0 ? "bg-background/20" : "bg-background/10"
                          }`}
                          data-testid={`row-shift-${s.id}`}
                        >
                          <span className="text-xs font-bold text-muted-foreground/50">{i + 1}</span>
                          <span className="font-bold text-foreground uppercase tracking-wide text-sm">{s.name}</span>
                          <span className="text-muted-foreground font-medium text-sm">{s.jobdesk || "-"}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {shift.staff.length > 0 && (
                    <div className="px-6 py-2.5 border-t border-white/5 bg-white/[0.01]">
                      <p className="text-[11px] text-muted-foreground/50 text-right">
                        {search ? `${shift.staff.length} dari ${shift.total}` : `${shift.total}`} staff
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
