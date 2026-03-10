import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStaff, useUpdateStaffJobdesk, useDeleteStaff } from "@/hooks/use-staff";
import { useUniqueJobdesks } from "@/hooks/use-unique-jobdesks";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import type { StaffPermission } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Briefcase, Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const SHIFTS = ["PAGI", "SORE", "MALAM"] as const;
type Shift = typeof SHIFTS[number];

export default function Jobdesk() {
  const { user } = useAuth();
  const { data: staffList } = useStaff();
  const { jobdesks } = useUniqueJobdesks();
  const { mutate: updateJobdesk, isPending: isSaving } = useUpdateStaffJobdesk();
  const { mutate: deleteStaff, isPending: isDeleting } = useDeleteStaff();
  const { data: myPerm } = useQuery<StaffPermission>({ queryKey: ["/api/permissions/me"] });

  const [activeShift, setActiveShift] = useState<Shift>("PAGI");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editJobdesk, setEditJobdesk] = useState("");
  const [isNewJobdeskMode, setIsNewJobdeskMode] = useState(false);
  const [newJobdeskText, setNewJobdeskText] = useState("");
  const [extraJobdesks, setExtraJobdesks] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const today = format(new Date(), "EEEE, dd MMM yyyy", { locale: localeId });

  const isAdmin = user?.role === "admin";
  const canEdit = isAdmin || !!myPerm?.canEditJobdesk;

  const allJobdesks = useMemo(
    () => [...new Set([...jobdesks, ...extraJobdesks])].sort(),
    [jobdesks, extraJobdesks]
  );

  const filtered = (staffList ?? []).filter(s => {
    const matchShift = s.shift === activeShift;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    return matchShift && matchSearch;
  });

  function startEdit(id: number, currentJobdesk: string) {
    setEditingId(id);
    setEditJobdesk(currentJobdesk);
    setIsNewJobdeskMode(false);
    setNewJobdeskText("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditJobdesk("");
    setIsNewJobdeskMode(false);
    setNewJobdeskText("");
  }

  function saveEdit(id: number) {
    const jobdeskToSave = isNewJobdeskMode ? newJobdeskText.trim() : editJobdesk;
    if (!jobdeskToSave) return;
    if (isNewJobdeskMode && !extraJobdesks.includes(jobdeskToSave) && !jobdesks.includes(jobdeskToSave)) {
      setExtraJobdesks(prev => [...prev, jobdeskToSave]);
    }
    updateJobdesk({ id, jobdesk: jobdeskToSave }, {
      onSuccess: () => cancelEdit(),
    });
  }

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
                  <h1 className="text-3xl font-display font-black tracking-wider text-primary uppercase">
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
                  {canEdit && (
                    <span className="ml-2 text-xs text-primary/60 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                      Mode Edit Aktif
                    </span>
                  )}
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
              <div className={`grid ${canEdit ? "grid-cols-3" : "grid-cols-2"} px-6 py-3 border-b border-white/10 bg-primary/5`}>
                <span className="text-xs font-bold text-primary/70 uppercase tracking-widest">Nama Staff</span>
                <span className="text-xs font-bold text-primary/70 uppercase tracking-widest">Jobdesk</span>
                {canEdit && (
                  <span className="text-xs font-bold text-primary/70 uppercase tracking-widest text-right">Aksi</span>
                )}
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
                    className={`grid ${canEdit ? "grid-cols-3" : "grid-cols-2"} items-center px-6 py-3 border-b border-white/5 hover:bg-primary/5 transition-colors ${
                      i % 2 === 0 ? "bg-background/20" : "bg-background/10"
                    }`}
                    data-testid={`row-jobdesk-${s.id}`}
                  >
                    <span className="font-bold text-foreground uppercase tracking-wide text-sm">{s.name}</span>

                    {/* Jobdesk column — editable when in edit mode */}
                    <div className="flex items-center gap-2">
                      {editingId === s.id ? (
                        isNewJobdeskMode ? (
                          <Input
                            autoFocus
                            placeholder="Ketik jobdesk baru..."
                            value={newJobdeskText}
                            onChange={e => setNewJobdeskText(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") saveEdit(s.id); if (e.key === "Escape") cancelEdit(); }}
                            className="h-8 text-sm bg-background/50 border-primary/30 focus-visible:ring-primary/30 rounded-lg w-40"
                            data-testid={`input-new-jobdesk-${s.id}`}
                          />
                        ) : (
                          <Select value={editJobdesk} onValueChange={(val) => {
                            if (val === "__new__") {
                              setIsNewJobdeskMode(true);
                              setNewJobdeskText("");
                            } else {
                              setEditJobdesk(val);
                            }
                          }}>
                            <SelectTrigger className="h-8 text-sm bg-background/50 border-primary/30 rounded-lg w-40" data-testid={`select-edit-jobdesk-${s.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {allJobdesks.map(j => (
                                <SelectItem key={j} value={j}>{j}</SelectItem>
                              ))}
                              <div className="border-t border-white/10 my-1" />
                              <SelectItem value="__new__" className="text-primary">
                                <span className="flex items-center gap-1"><Plus className="w-3 h-3" /> Jobdesk Baru</span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )
                      ) : (
                        <span className="text-muted-foreground font-medium text-sm">{s.jobdesk}</span>
                      )}
                    </div>

                    {/* Action column */}
                    {canEdit && (
                      <div className="flex items-center justify-end gap-1">
                        {editingId === s.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => saveEdit(s.id)}
                              disabled={isSaving || (!isNewJobdeskMode && !editJobdesk) || (isNewJobdeskMode && !newJobdeskText.trim())}
                              className="h-7 px-2 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs"
                              data-testid={`button-save-jobdesk-${s.id}`}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Simpan
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                              className="h-7 px-2 rounded-lg text-muted-foreground hover:text-foreground text-xs"
                              data-testid={`button-cancel-edit-${s.id}`}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        ) : confirmDeleteId === s.id ? (
                          <>
                            <span className="text-xs text-red-400 font-medium">Hapus staff ini?</span>
                            <Button
                              size="sm"
                              onClick={() => { deleteStaff(s.id); setConfirmDeleteId(null); }}
                              disabled={isDeleting}
                              className="h-7 px-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-xs"
                              data-testid={`button-confirm-delete-jobdesk-${s.id}`}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Ya, Hapus
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmDeleteId(null)}
                              className="h-7 px-2 rounded-lg text-muted-foreground hover:text-foreground text-xs"
                              data-testid={`button-cancel-delete-jobdesk-${s.id}`}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1">
                            {canEdit && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEdit(s.id, s.jobdesk)}
                                className="h-7 px-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 text-xs"
                                data-testid={`button-edit-jobdesk-${s.id}`}
                              >
                                <Pencil className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                            )}
                            {isAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmDeleteId(s.id)}
                                className="h-7 px-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 text-xs"
                                data-testid={`button-delete-jobdesk-${s.id}`}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Hapus
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
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
