import { useMemo, useState } from "react";
import { useStaff, useUpdateStaffCutiStatus, useDeleteStaff } from "@/hooks/use-staff";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserX, Search, Pencil, Check, X, Trash2 } from "lucide-react";
import type { Staff } from "@shared/schema";

const CUTI_OPTIONS = ["Izin", "Sakit", "Cuti Tahunan", "Cuti Khusus", "Alpha"];

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
        Hadir
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
      {status}
    </Badge>
  );
}

export default function StaffCuti() {
  const { user } = useAuth();
  const { data: staffList = [], isLoading } = useStaff();
  const { mutate: updateCutiStatus, isPending } = useUpdateStaffCutiStatus();
  const { mutate: deleteStaff, isPending: isDeleting } = useDeleteStaff();

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);
  const [customText, setCustomText] = useState("");
  const [filterStatus, setFilterStatus] = useState<"SEMUA" | "HADIR" | "CUTI">("SEMUA");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const isAdmin = user?.role === "admin";
  const isCsLine = useMemo(() => {
    if (!staffList || !user) return false;
    return staffList.some(s => s.name === user.username && s.jobdesk === "CS LINE");
  }, [staffList, user]);
  const isKapten = useMemo(() => {
    if (!staffList || !user) return false;
    return staffList.some(s => s.name === user.username && s.role?.toLowerCase() === "kapten");
  }, [staffList, user]);

  const canEdit = isAdmin || isCsLine || isKapten;

  const filtered = staffList.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filterStatus === "SEMUA" ||
      (filterStatus === "HADIR" && !s.cutiStatus) ||
      (filterStatus === "CUTI" && !!s.cutiStatus);
    return matchSearch && matchFilter;
  });

  const totalCuti = staffList.filter(s => !!s.cutiStatus).length;
  const totalHadir = staffList.filter(s => !s.cutiStatus).length;

  function startEdit(s: Staff) {
    setEditingId(s.id);
    setEditStatus(s.cutiStatus ?? "");
    setIsCustom(false);
    setCustomText("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditStatus("");
    setIsCustom(false);
    setCustomText("");
  }

  function saveEdit(id: number) {
    const finalStatus = isCustom ? customText.trim() : (editStatus || null);
    updateCutiStatus({ id, status: finalStatus || null }, {
      onSuccess: () => cancelEdit(),
    });
  }

  function clearStatus(id: number) {
    updateCutiStatus({ id, status: null });
  }

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 overflow-auto relative z-10">
          {/* Hero */}
          <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background border-b border-primary/20 px-6 py-8">
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <UserX className="w-6 h-6 text-primary" />
                  <h1 className="text-3xl font-display font-black tracking-wider text-primary uppercase">
                    STAFF CUTI
                  </h1>
                </div>
                <p className="text-muted-foreground text-sm">Monitor dan kelola status cuti seluruh staff</p>
              </div>
              {/* Summary */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{totalHadir}</p>
                  <p className="text-xs text-muted-foreground">Hadir</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">{totalCuti}</p>
                  <p className="text-xs text-muted-foreground">Cuti</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{staffList.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-4">
            {/* Filter bar */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48 max-w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama staff..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 bg-background/50 border-white/10 focus-visible:ring-primary/30 h-9 text-sm rounded-xl"
                  data-testid="input-search-cuti"
                />
              </div>
              <div className="flex gap-2">
                {(["SEMUA", "HADIR", "CUTI"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterStatus(f)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                      filterStatus === f
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                        : "bg-background/50 text-muted-foreground border-white/10 hover:border-primary/40"
                    }`}
                    data-testid={`filter-status-${f}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {canEdit && (
                <span className="ml-auto text-xs text-primary/60 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                  Mode Edit Aktif
                </span>
              )}
            </div>

            {/* Table */}
            <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
              {/* Column headers */}
              <div className={`grid ${canEdit ? "grid-cols-4" : "grid-cols-3"} px-6 py-3 border-b border-white/10 bg-primary/5`}>
                <span className="text-xs font-bold text-primary/70 uppercase tracking-widest">Nama Staff</span>
                <span className="text-xs font-bold text-primary/70 uppercase tracking-widest">Jabatan</span>
                <span className="text-xs font-bold text-primary/70 uppercase tracking-widest">Status Cuti</span>
                {canEdit && (
                  <span className="text-xs font-bold text-primary/70 uppercase tracking-widest text-right">Aksi</span>
                )}
              </div>

              {isLoading ? (
                <div className="px-6 py-12 text-center text-muted-foreground text-sm">
                  <div className="animate-spin inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full mb-2" />
                  <p>Memuat data staff...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-6 py-12 text-center text-muted-foreground text-sm">
                  {search ? "Tidak ada staff yang cocok" : "Belum ada staff terdaftar"}
                </div>
              ) : (
                filtered.map((s, i) => (
                  <div
                    key={s.id}
                    className={`grid ${canEdit ? "grid-cols-4" : "grid-cols-3"} items-center px-6 py-3.5 border-b border-white/5 hover:bg-primary/5 transition-colors ${
                      i % 2 === 0 ? "bg-background/20" : "bg-background/10"
                    }`}
                    data-testid={`row-cuti-${s.id}`}
                  >
                    <span className="font-bold text-foreground uppercase tracking-wide text-sm">{s.name}</span>
                    <span className="text-muted-foreground text-sm">{s.jobdesk}</span>

                    {/* Status column */}
                    <div>
                      {editingId === s.id ? (
                        <div className="flex items-center gap-2">
                          {isCustom ? (
                            <Input
                              autoFocus
                              placeholder="Status custom..."
                              value={customText}
                              onChange={e => setCustomText(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") saveEdit(s.id); if (e.key === "Escape") cancelEdit(); }}
                              className="h-7 text-xs bg-background/50 border-primary/30 rounded-lg w-36"
                              data-testid={`input-custom-status-${s.id}`}
                            />
                          ) : (
                            <Select value={editStatus || "__clear__"} onValueChange={val => {
                              if (val === "__custom__") { setIsCustom(true); setCustomText(""); }
                              else if (val === "__clear__") setEditStatus("");
                              else setEditStatus(val);
                            }}>
                              <SelectTrigger className="h-7 text-xs bg-background/50 border-primary/30 rounded-lg w-36" data-testid={`select-cuti-status-${s.id}`}>
                                <SelectValue placeholder="Pilih status..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__clear__">— Hapus Status (Hadir)</SelectItem>
                                {CUTI_OPTIONS.map(o => (
                                  <SelectItem key={o} value={o}>{o}</SelectItem>
                                ))}
                                <div className="border-t border-white/10 my-1" />
                                <SelectItem value="__custom__" className="text-primary">+ Status Custom</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      ) : (
                        <StatusBadge status={s.cutiStatus ?? null} />
                      )}
                    </div>

                    {/* Actions */}
                    {canEdit && (
                      <div className="flex items-center justify-end gap-1">
                        {editingId === s.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => saveEdit(s.id)}
                              disabled={isPending}
                              className="h-7 px-2 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs"
                              data-testid={`button-save-cuti-${s.id}`}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Simpan
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                              className="h-7 px-2 rounded-lg text-muted-foreground hover:text-foreground text-xs"
                              data-testid={`button-cancel-cuti-${s.id}`}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        ) : confirmDeleteId === s.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-red-400 font-medium">Hapus staff ini?</span>
                            <Button
                              size="sm"
                              onClick={() => { deleteStaff(s.id); setConfirmDeleteId(null); }}
                              disabled={isDeleting}
                              className="h-7 px-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-xs"
                              data-testid={`button-confirm-delete-cuti-${s.id}`}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Ya, Hapus
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmDeleteId(null)}
                              className="h-7 px-2 rounded-lg text-muted-foreground hover:text-foreground text-xs"
                              data-testid={`button-cancel-delete-cuti-${s.id}`}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(s)}
                              className="h-7 px-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 text-xs"
                              data-testid={`button-edit-cuti-${s.id}`}
                            >
                              <Pencil className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            {s.cutiStatus && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => clearStatus(s.id)}
                                disabled={isPending}
                                className="h-7 px-2 rounded-lg text-muted-foreground hover:text-orange-400 hover:bg-orange-500/10 text-xs"
                                data-testid={`button-clear-cuti-${s.id}`}
                                title="Hapus Status"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Hapus Status
                              </Button>
                            )}
                            {isAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmDeleteId(s.id)}
                                className="h-7 px-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 text-xs"
                                data-testid={`button-delete-cuti-${s.id}`}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Hapus Staff
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

            <p className="text-xs text-muted-foreground text-right">
              {filtered.length} dari {staffList.length} staff ditampilkan
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
