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
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-500/5 blur-[120px] pointer-events-none" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 overflow-auto relative z-10">
          {/* Hero header with gold theme */}
          <div className="relative bg-gradient-to-br from-yellow-900/40 via-yellow-800/20 to-background border-b border-yellow-500/20 px-6 py-8">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNWM1MTgiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMCAwdi02aC02djZoNnptNiAwaDZ2LTZoLTZ2NnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Briefcase className="w-6 h-6 text-yellow-400" />
                  <h1 className="text-3xl font-display font-black tracking-wider text-yellow-400 uppercase" style={{ textShadow: "0 0 30px rgba(245,197,24,0.5)" }}>
                    JOBDESK
                  </h1>
                </div>
                <p className="text-yellow-200/60 text-sm">Daftar staff per shift & jobdesk</p>
              </div>
              <p className="text-yellow-400/80 font-semibold text-sm" data-testid="text-date">{today}</p>
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
                      ? "bg-yellow-500 text-black border-yellow-400 shadow-lg shadow-yellow-500/30"
                      : "bg-background/50 text-yellow-200/60 border-yellow-500/20 hover:border-yellow-500/50 hover:text-yellow-200/80"
                  }`}
                  data-testid={`tab-shift-${shift}`}
                >
                  {shift}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="glass-panel rounded-2xl border border-yellow-500/20 overflow-hidden">
              {/* Table header */}
              <div className="px-6 py-4 border-b border-yellow-500/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 text-sm">☀</span>
                  <span className="font-bold text-yellow-300 uppercase tracking-wider text-sm">
                    JOBDESK {activeShift}
                  </span>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari Nama Staff..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 bg-background/50 border-yellow-500/20 focus-visible:ring-yellow-500/30 text-sm h-9"
                    data-testid="input-search-jobdesk"
                  />
                </div>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-2 px-6 py-3 border-b border-yellow-500/10 bg-yellow-500/5">
                <span className="text-xs font-bold text-yellow-400/70 uppercase tracking-widest">Nama Staff</span>
                <span className="text-xs font-bold text-yellow-400/70 uppercase tracking-widest">Jobdesk</span>
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
                    className={`grid grid-cols-2 px-6 py-4 border-b border-yellow-500/5 hover:bg-yellow-500/5 transition-colors ${
                      i % 2 === 0 ? "bg-background/20" : "bg-background/10"
                    }`}
                    data-testid={`row-jobdesk-${s.id}`}
                  >
                    <span className="font-bold text-foreground uppercase tracking-wide text-sm">{s.name}</span>
                    <span className="text-yellow-200/70 font-medium text-sm">{s.jobdesk}</span>
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
