import { useState } from "react";
import { useStaff } from "@/hooks/use-staff";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Input } from "@/components/ui/input";
import { Search, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const SHIFTS = ["PAGI", "SORE", "MALAM"] as const;
type Shift = typeof SHIFTS[number];

export default function Jobdesk() {
  const { data: staffList } = useStaff();
  const [activeShift, setActiveShift] = useState<Shift>("PAGI");
  const [search, setSearch] = useState("");

  const today = format(new Date(), "EEEE, dd MMM yyyy", { locale: localeId });

  const filtered = (staffList ?? []).filter(s => {
    const matchShift = s.shift === activeShift;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    return matchShift && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 overflow-auto relative z-10">
          {/* Hero header */}
          <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background border-b border-primary/20 px-6 py-8">
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Briefcase className="w-6 h-6 text-primary" />
                  <h1 className="text-3xl font-display font-black tracking-wider text-primary uppercase" style={{ textShadow: "0 0 30px rgba(var(--primary), 0.4)" }}>
                    JOBDESK
                  </h1>
                </div>
                <p className="text-muted-foreground text-sm">Daftar staff per shift & jobdesk</p>
              </div>
              <p className="text-primary/80 font-semibold text-sm" data-testid="text-date">{today}</p>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Shift Tabs */}
            <div className="flex gap-2">
              {SHIFTS.map(shift => (
                <button
                  key={shift}
                  onClick={() => setActiveShift(shift)}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider border transition-all ${
                    activeShift === shift
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30"
                      : "bg-background/50 text-muted-foreground border-white/10 hover:border-primary/50 hover:text-foreground"
                  }`}
                  data-testid={`tab-shift-${shift}`}
                >
                  {shift}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
              {/* Table header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-primary text-sm">✦</span>
                  <span className="font-bold text-primary uppercase tracking-wider text-sm">
                    JOBDESK {activeShift}
                  </span>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari Nama Staff..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 bg-background/50 border-white/10 focus-visible:ring-primary/30 text-sm h-9"
                    data-testid="input-search-jobdesk"
                  />
                </div>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-2 px-6 py-3 border-b border-white/10 bg-primary/5">
                <span className="text-xs font-bold text-primary/70 uppercase tracking-widest">Nama Staff</span>
                <span className="text-xs font-bold text-primary/70 uppercase tracking-widest">Jobdesk</span>
              </div>

              {/* Rows */}
              {filtered.length === 0 ? (
                <div className="px-6 py-12 text-center text-muted-foreground text-sm">
                  {search ? "Tidak ada staff yang cocok" : `Belum ada staff untuk shift ${activeShift}`}
                </div>
              ) : (
                filtered.map((s, i) => (
                  <div
                    key={s.id}
                    className={`grid grid-cols-2 px-6 py-4 border-b border-white/5 hover:bg-primary/5 transition-colors ${
                      i % 2 === 0 ? "bg-background/20" : "bg-background/10"
                    }`}
                    data-testid={`row-jobdesk-${s.id}`}
                  >
                    <span className="font-bold text-foreground uppercase tracking-wide text-sm">{s.name}</span>
                    <span className="text-muted-foreground font-medium text-sm">{s.jobdesk}</span>
                  </div>
                ))
              )}
            </div>

            {filtered.length > 0 && (
              <p className="text-xs text-muted-foreground text-right">{filtered.length} staff pada shift {activeShift}</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
