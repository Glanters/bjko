import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStaff, useUpdateStaff } from "@/hooks/use-staff";
import { useAuth } from "@/hooks/use-auth";
import type { StaffPermission } from "@shared/schema";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sun, Sunset, Moon, Search, Settings2, Clock,
  LogIn, LogOut, ChevronDown, ChevronUp, Save,
  Users, X, CheckSquare, ArrowRightLeft, Shuffle,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";

type ShiftKey = "PAGI" | "GANTUNG" | "SORE" | "MALAM";
type ShiftSchedule = Record<ShiftKey, { start: string; end: string }>;

const DEFAULT_SCHEDULE: ShiftSchedule = {
  PAGI:    { start: "08:00", end: "16:00" },
  GANTUNG: { start: "00:00", end: "00:00" },
  SORE:    { start: "16:00", end: "00:00" },
  MALAM:   { start: "00:00", end: "08:00" },
};

const SHIFTS = [
  {
    key: "PAGI" as ShiftKey,
    label: "Shift Pagi",
    icon: Sun,
    gradient: "from-amber-500/20 via-amber-400/10 to-transparent",
    border: "border-amber-500/30",
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    dot: "bg-amber-400",
    header: "text-amber-400",
    row: "hover:bg-amber-500/5",
    selectedRow: "bg-amber-500/10",
  },
  {
    key: "GANTUNG" as ShiftKey,
    label: "Shift Gantung",
    icon: Shuffle,
    gradient: "from-violet-500/20 via-violet-400/10 to-transparent",
    border: "border-violet-500/30",
    badge: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    dot: "bg-violet-400",
    header: "text-violet-400",
    row: "hover:bg-violet-500/5",
    selectedRow: "bg-violet-500/10",
  },
  {
    key: "SORE" as ShiftKey,
    label: "Shift Sore",
    icon: Sunset,
    gradient: "from-orange-500/20 via-orange-400/10 to-transparent",
    border: "border-orange-500/30",
    badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    dot: "bg-orange-400",
    header: "text-orange-400",
    row: "hover:bg-orange-500/5",
    selectedRow: "bg-orange-500/10",
  },
  {
    key: "MALAM" as ShiftKey,
    label: "Shift Malam",
    icon: Moon,
    gradient: "from-blue-500/20 via-blue-400/10 to-transparent",
    border: "border-blue-500/30",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    dot: "bg-blue-400",
    header: "text-blue-400",
    row: "hover:bg-blue-500/5",
    selectedRow: "bg-blue-500/10",
  },
];

const SHIFT_COLORS: Record<ShiftKey, { text: string; bg: string; border: string }> = {
  PAGI:    { text: "text-amber-400",  bg: "bg-amber-500/20",  border: "border-amber-500/40" },
  GANTUNG: { text: "text-violet-400", bg: "bg-violet-500/20", border: "border-violet-500/40" },
  SORE:    { text: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/40" },
  MALAM:   { text: "text-blue-400",   bg: "bg-blue-500/20",   border: "border-blue-500/40" },
};

function calcJamKerja(start: string, end: string): string {
  if (start === end) return "Fleksibel";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;
  if (endMins <= startMins) endMins += 24 * 60;
  const diff = endMins - startMins;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m === 0 ? `${h} Jam` : `${h}j ${m}m`;
}

function useShiftSchedule() {
  return useQuery<ShiftSchedule>({
    queryKey: ["/api/shift-schedule"],
    queryFn: async () => {
      const res = await fetch("/api/shift-schedule", { credentials: "include" });
      if (!res.ok) return DEFAULT_SCHEDULE;
      return res.json();
    },
    staleTime: 60_000,
  });
}

function useSaveShiftSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (schedule: ShiftSchedule) => {
      const res = await apiRequest("POST", "/api/shift-schedule", { schedule });
      if (!res.ok) throw new Error("Gagal menyimpan jadwal shift");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shift-schedule"] });
      toast({ title: "Jadwal Disimpan", description: "Jam kerja setiap shift berhasil diperbarui." });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    },
  });
}

function useBatchShift() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ staffIds, shift }: { staffIds: number[]; shift: ShiftKey }) => {
      const res = await apiRequest("POST", "/api/staff/batch-shift", { staffIds, shift });
      if (!res.ok) throw new Error("Gagal memindahkan shift");
      return res.json() as Promise<{ updated: number }>;
    },
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: [api.staff.list.path] });
      toast({
        title: "Shift Berhasil Diubah",
        description: `${data.updated} staff berhasil dipindahkan ke Shift ${vars.shift}.`,
      });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    },
  });
}

export default function ShiftKerja() {
  const { user } = useAuth();
  const { data: staffList } = useStaff();
  const { data: schedule } = useShiftSchedule();
  const { mutate: saveSchedule, isPending: isSaving } = useSaveShiftSchedule();
  const { mutate: batchShift, isPending: isBatchSaving } = useBatchShift();
  const { mutate: updateStaff } = useUpdateStaff();

  const [search, setSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [editSchedule, setEditSchedule] = useState<ShiftSchedule | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkTargetShift, setBulkTargetShift] = useState<ShiftKey>("PAGI");

  const { data: myPerm } = useQuery<StaffPermission>({ queryKey: ["/api/permissions/me"] });

  const isAdmin = user?.role === "admin";
  const canEditShift = isAdmin || !!myPerm?.canEditJobdesk;

  const ALL_SHIFTS: ShiftKey[] = ["PAGI", "GANTUNG", "SORE", "MALAM"];
  const allowedShiftOptions: ShiftKey[] = isAdmin
    ? ALL_SHIFTS
    : myPerm?.allowedShifts
      ? (myPerm.allowedShifts.split(",").filter(s => ALL_SHIFTS.includes(s as ShiftKey)) as ShiftKey[])
      : ALL_SHIFTS;

  const today = format(new Date(), "EEEE, dd MMM yyyy", { locale: localeId });
  const sch = schedule ?? DEFAULT_SCHEDULE;

  const grouped = SHIFTS.map(shift => ({
    ...shift,
    staff: (staffList ?? []).filter(s => {
      const matchShift = s.shift === shift.key;
      const matchSearch = !search.trim() ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.jobdesk.toLowerCase().includes(search.toLowerCase());
      const notOnCuti = !s.cutiStatus;
      return matchShift && matchSearch && notOnCuti;
    }),
    total: (staffList ?? []).filter(s => s.shift === shift.key && !s.cutiStatus).length,
    schedule: sch[shift.key],
  }));

  // Selection helpers
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (shiftStaffIds: number[], allSelected: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) shiftStaffIds.forEach(id => next.delete(id));
      else shiftStaffIds.forEach(id => next.add(id));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkAssign = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    batchShift({ staffIds: ids, shift: bulkTargetShift }, {
      onSuccess: () => clearSelection(),
    });
  };

  function openSettings() {
    setEditSchedule(JSON.parse(JSON.stringify(sch)));
    setShowSettings(true);
  }

  function handleSaveSchedule() {
    if (!editSchedule) return;
    saveSchedule(editSchedule, { onSuccess: () => setShowSettings(false) });
  }

  const totalSelected = selectedIds.size;
  const allFilteredIds = grouped.flatMap(g => g.staff.map(s => s.id));

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 overflow-auto relative z-10 pb-28">
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
                <p className="text-muted-foreground text-sm">Daftar staff per shift · centang untuk pindah shift sekaligus</p>
              </div>
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={showSettings ? () => setShowSettings(false) : openSettings}
                    className="h-8 px-3 rounded-lg border border-white/10 text-muted-foreground hover:text-primary hover:border-primary/30 text-xs"
                    data-testid="button-atur-jam-shift"
                  >
                    <Settings2 className="w-3.5 h-3.5 mr-1.5" />
                    Atur Jam Shift
                    {showSettings ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                  </Button>
                )}
                <p className="text-primary/80 font-semibold text-sm" data-testid="text-date">{today}</p>
              </div>
            </div>
          </div>

          {/* Jam Shift Settings Panel */}
          {isAdmin && showSettings && editSchedule && (
            <div className="mx-6 mt-4 p-5 rounded-2xl border border-primary/20 bg-primary/5 space-y-4" data-testid="panel-shift-settings">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-primary uppercase tracking-wider">Atur Jam Kerja Per Shift</span>
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveSchedule}
                  disabled={isSaving}
                  className="h-8 px-4 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs"
                  data-testid="button-save-shift-schedule"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {SHIFTS.map(shift => (
                  <div key={shift.key} className={`rounded-xl border ${shift.border} p-4 space-y-3`} data-testid={`setting-shift-${shift.key.toLowerCase()}`}>
                    <div className="flex items-center gap-2">
                      <shift.icon className={`w-4 h-4 ${shift.header}`} />
                      <span className={`text-xs font-bold uppercase tracking-wider ${shift.header}`}>{shift.label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                          <LogIn className="w-3 h-3" />Jam Masuk
                        </label>
                        <Input
                          type="time"
                          value={editSchedule[shift.key].start}
                          onChange={e => setEditSchedule(prev => prev ? {
                            ...prev, [shift.key]: { ...prev[shift.key], start: e.target.value }
                          } : prev)}
                          className="h-8 text-xs bg-background/50 border-white/10 focus-visible:ring-primary/30"
                          data-testid={`input-start-${shift.key.toLowerCase()}`}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                          <LogOut className="w-3 h-3" />Jam Pulang
                        </label>
                        <Input
                          type="time"
                          value={editSchedule[shift.key].end}
                          onChange={e => setEditSchedule(prev => prev ? {
                            ...prev, [shift.key]: { ...prev[shift.key], end: e.target.value }
                          } : prev)}
                          className="h-8 text-xs bg-background/50 border-white/10 focus-visible:ring-primary/30"
                          data-testid={`input-end-${shift.key.toLowerCase()}`}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Total: <span className={`font-bold ${shift.header}`}>{calcJamKerja(editSchedule[shift.key].start, editSchedule[shift.key].end)}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="px-6 py-6 space-y-4">
            {/* Top bar: search + select all */}
            <div className="flex items-center gap-4 flex-wrap">
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
              {canEditShift && allFilteredIds.length > 0 && (
                <button
                  onClick={() => {
                    const allSelected = allFilteredIds.every(id => selectedIds.has(id));
                    if (allSelected) clearSelection();
                    else setSelectedIds(new Set(allFilteredIds));
                  }}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-primary/30"
                  data-testid="button-select-all"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  {allFilteredIds.every(id => selectedIds.has(id)) ? "Batal Pilih Semua" : "Pilih Semua"}
                </button>
              )}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4">
              {grouped.map(shift => (
                <div
                  key={shift.key}
                  className={`glass-panel rounded-2xl border ${shift.border} p-4 flex items-center gap-4`}
                  data-testid={`card-summary-${shift.key.toLowerCase()}`}
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${shift.gradient} border ${shift.border} flex items-center justify-center shrink-0`}>
                    <shift.icon className={`w-5 h-5 ${shift.header}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold uppercase tracking-wider ${shift.header}`}>{shift.label}</p>
                    <p className="text-2xl font-black text-foreground">{shift.total}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <LogIn className="w-2.5 h-2.5" />{shift.schedule.start}
                      </span>
                      <span className="text-muted-foreground/40 text-[10px]">—</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <LogOut className="w-2.5 h-2.5" />{shift.schedule.end}
                      </span>
                      <span className={`text-[10px] font-bold ${shift.header}`}>
                        ({calcJamKerja(shift.schedule.start, shift.schedule.end)})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Shift sections */}
            <div className="grid grid-cols-1 gap-6">
              {grouped.map(shift => {
                const shiftIds = shift.staff.map(s => s.id);
                const allShiftSelected = shiftIds.length > 0 && shiftIds.every(id => selectedIds.has(id));
                const someShiftSelected = shiftIds.some(id => selectedIds.has(id));

                return (
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
                        <span className={`font-black uppercase tracking-widest text-sm ${shift.header}`}>{shift.label}</span>
                        <span className="text-xs text-muted-foreground/60 font-medium">
                          {shift.schedule.start} – {shift.schedule.end}
                          <span className={`ml-1.5 font-bold ${shift.header}`}>
                            ({calcJamKerja(shift.schedule.start, shift.schedule.end)})
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {canEditShift && shiftIds.length > 0 && (
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleSelectAll(shiftIds, allShiftSelected)}
                            onKeyDown={e => e.key === "Enter" && toggleSelectAll(shiftIds, allShiftSelected)}
                            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors cursor-pointer select-none"
                            data-testid={`button-select-all-${shift.key.toLowerCase()}`}
                          >
                            <Checkbox
                              checked={allShiftSelected}
                              data-state={someShiftSelected && !allShiftSelected ? "indeterminate" : undefined}
                              className="w-3.5 h-3.5 pointer-events-none"
                            />
                            {allShiftSelected ? "Batal Semua" : "Pilih Semua"}
                          </div>
                        )}
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${shift.badge}`}>
                          {shift.total} Staff
                        </span>
                      </div>
                    </div>

                    {/* Column headers */}
                    <div className={`grid ${canEditShift ? "grid-cols-[36px_36px_1fr_130px_90px_90px_90px]" : "grid-cols-[36px_1fr_130px_90px_90px_90px]"} px-6 py-2.5 border-b border-white/10 bg-white/[0.02]`}>
                      {canEditShift && <span className="text-[10px] font-bold text-muted-foreground/60 uppercase" />}
                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">#</span>
                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Nama Staff</span>
                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Jabatan</span>
                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1">
                        <LogIn className="w-3 h-3" />Masuk
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1">
                        <LogOut className="w-3 h-3" />Pulang
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" />Jam
                      </span>
                    </div>

                    {/* Rows */}
                    {shift.staff.length === 0 ? (
                      <div className="px-6 py-10 text-center text-muted-foreground text-sm">
                        {search ? "Tidak ada staff yang cocok" : `Belum ada staff untuk ${shift.label}`}
                      </div>
                    ) : (
                      <div>
                        {shift.staff.map((s, i) => {
                          const isSelected = selectedIds.has(s.id);
                          return (
                            <div
                              key={s.id}
                              onClick={() => canEditShift && toggleSelect(s.id)}
                              className={`grid ${canEditShift ? "grid-cols-[36px_36px_1fr_130px_90px_90px_90px]" : "grid-cols-[36px_1fr_130px_90px_90px_90px]"} items-center px-6 py-3 border-b border-white/5 transition-colors ${
                                isSelected ? shift.selectedRow + " border-l-2 border-l-primary/40" : (i % 2 === 0 ? "bg-background/20" : "bg-background/10")
                              } ${canEditShift ? "cursor-pointer " + shift.row : ""}`}
                              data-testid={`row-shift-${s.id}`}
                            >
                              {canEditShift && (
                                <div className="flex items-center" onClick={e => e.stopPropagation()}>
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleSelect(s.id)}
                                    className="w-4 h-4"
                                    data-testid={`checkbox-staff-${s.id}`}
                                  />
                                </div>
                              )}

                              <span className="text-xs font-bold text-muted-foreground/40">{i + 1}</span>

                              {/* Name + inline shift dropdown */}
                              <div className="flex items-center gap-2 min-w-0" onClick={e => e.stopPropagation()}>
                                <span className="font-bold text-foreground uppercase tracking-wide text-sm truncate">{s.name}</span>
                                {canEditShift && (
                                  <Select
                                    value={s.shift}
                                    onValueChange={(newShift) => {
                                      updateStaff({ id: s.id, name: s.name, jobdesk: s.jobdesk, shift: newShift });
                                    }}
                                  >
                                    <SelectTrigger
                                      className={`h-5 w-auto min-w-[52px] text-[10px] font-bold border px-1.5 rounded-md focus:ring-0 focus:ring-offset-0 ${shift.badge} bg-transparent`}
                                      data-testid={`select-change-shift-${s.id}`}
                                    >
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {allowedShiftOptions.map(sk => (
                                        <SelectItem key={sk} value={sk} className={`text-xs font-bold ${SHIFT_COLORS[sk].text}`}>{sk}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>

                              <span className="text-muted-foreground font-medium text-sm truncate">{s.jobdesk || "-"}</span>
                              <span className={`text-sm font-bold ${shift.header}`}>{shift.schedule.start}</span>
                              <span className="text-sm font-medium text-muted-foreground">{shift.schedule.end}</span>
                              <span className="text-xs font-bold text-foreground/80 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-muted-foreground/40" />
                                {calcJamKerja(shift.schedule.start, shift.schedule.end)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {shift.staff.length > 0 && (
                      <div className="px-6 py-2.5 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground/50">
                          Jam Kerja: <span className={`font-bold ${shift.header}`}>{calcJamKerja(shift.schedule.start, shift.schedule.end)}</span>
                        </span>
                        <p className="text-[11px] text-muted-foreground/50">
                          {search ? `${shift.staff.length} dari ${shift.total}` : `${shift.total}`} staff
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {/* ===== Floating Bulk Action Bar ===== */}
      {canEditShift && totalSelected > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-xl shadow-2xl shadow-primary/20 min-w-[480px]"
          data-testid="bulk-action-bar"
        >
          {/* Count badge */}
          <div className="flex items-center gap-2 mr-1">
            <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground leading-none mb-0.5">Staff dipilih</p>
              <p className="text-lg font-black text-primary leading-none">{totalSelected}</p>
            </div>
          </div>

          <div className="w-px h-8 bg-white/10" />

          {/* Arrow icon */}
          <ArrowRightLeft className="w-4 h-4 text-muted-foreground shrink-0" />

          {/* Pindahkan ke label */}
          <span className="text-sm text-muted-foreground whitespace-nowrap">Pindahkan ke Shift</span>

          {/* Shift selector */}
          <Select value={bulkTargetShift} onValueChange={(v) => setBulkTargetShift(v as ShiftKey)}>
            <SelectTrigger
              className={`h-9 w-[120px] text-sm font-bold border rounded-xl focus:ring-0 focus:ring-offset-0 ${SHIFT_COLORS[bulkTargetShift].bg} ${SHIFT_COLORS[bulkTargetShift].border} ${SHIFT_COLORS[bulkTargetShift].text}`}
              data-testid="select-bulk-target-shift"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allowedShiftOptions.map(sk => (
                <SelectItem key={sk} value={sk} className={`text-sm font-bold ${SHIFT_COLORS[sk].text}`}>{sk}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Terapkan button */}
          <Button
            onClick={handleBulkAssign}
            disabled={isBatchSaving}
            className="h-9 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm"
            data-testid="button-bulk-apply"
          >
            {isBatchSaving ? "Menyimpan..." : "Terapkan"}
          </Button>

          {/* Cancel */}
          <button
            onClick={clearSelection}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            data-testid="button-bulk-cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
