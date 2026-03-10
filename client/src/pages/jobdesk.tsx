import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStaff, useCreateStaff, useUpdateStaff, useDeleteStaff } from "@/hooks/use-staff";
import { useUniqueJobdesks } from "@/hooks/use-unique-jobdesks";
import { useJobdeskMasterList, useAddJobdeskToMaster, useDeleteJobdeskFromMaster } from "@/hooks/use-jobdesk-list";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import type { StaffPermission } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Briefcase, Pencil, Plus, Trash2, Settings2, ChevronDown, ChevronUp, X, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const SHIFTS = ["PAGI", "SORE", "MALAM"] as const;
type Shift = typeof SHIFTS[number];

export default function Jobdesk() {
  const { user } = useAuth();
  const { data: staffList } = useStaff();
  const { jobdesks: staffJobdesks } = useUniqueJobdesks();
  const { mutate: updateStaff, isPending: isSaving } = useUpdateStaff();
  const { mutate: createStaff, isPending: isCreating } = useCreateStaff();
  const { mutate: deleteStaff, isPending: isDeleting } = useDeleteStaff();
  const { data: myPerm } = useQuery<StaffPermission>({ queryKey: ["/api/permissions/me"] });
  const { data: masterData } = useJobdeskMasterList();
  const { mutate: addToMaster } = useAddJobdeskToMaster();
  const { mutate: deleteFromMaster, isPending: isDeletingJobdesk } = useDeleteJobdeskFromMaster();

  const [activeShift, setActiveShift] = useState<Shift>("PAGI");
  const [search, setSearch] = useState("");
  const [showManage, setShowManage] = useState(false);
  const [confirmDeleteJobdesk, setConfirmDeleteJobdesk] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Add staff modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addJobdesk, setAddJobdesk] = useState("");
  const [addShift, setAddShift] = useState<Shift>(activeShift);
  const [addNewJobdeskMode, setAddNewJobdeskMode] = useState(false);
  const [addNewJobdeskText, setAddNewJobdeskText] = useState("");

  // Edit staff modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editJobdesk, setEditJobdesk] = useState("");
  const [editShift, setEditShift] = useState<Shift>("PAGI");
  const [editNewJobdeskMode, setEditNewJobdeskMode] = useState(false);
  const [editNewJobdeskText, setEditNewJobdeskText] = useState("");

  const today = format(new Date(), "EEEE, dd MMM yyyy", { locale: localeId });

  const isAdmin = user?.role === "admin";
  const canEdit = isAdmin || !!myPerm?.canEditJobdesk;
  const canAdd = isAdmin || !!myPerm?.canAddStaff;
  const canDelete = isAdmin || !!myPerm?.canDeleteStaff;

  const masterList = masterData?.jobdesks ?? [];

  const allJobdesks = useMemo(
    () => Array.from(new Set([...masterList, ...staffJobdesks])).filter(Boolean).sort(),
    [masterList, staffJobdesks]
  );

  const filtered = (staffList ?? []).filter(s => {
    const matchShift = s.shift === activeShift;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    return matchShift && matchSearch;
  });

  // Add modal handlers
  function openAddModal() {
    setAddName("");
    setAddJobdesk(allJobdesks[0] ?? "");
    setAddShift(activeShift);
    setAddNewJobdeskMode(false);
    setAddNewJobdeskText("");
    setShowAddModal(true);
  }

  function handleAdd() {
    const nameVal = addName.trim();
    const jobdeskVal = addNewJobdeskMode ? addNewJobdeskText.trim() : addJobdesk;
    if (!nameVal || !jobdeskVal) return;
    if (addNewJobdeskMode && !allJobdesks.includes(jobdeskVal)) {
      addToMaster(jobdeskVal);
    }
    createStaff({ name: nameVal, jobdesk: jobdeskVal, shift: addShift }, {
      onSuccess: () => setShowAddModal(false),
    });
  }

  // Edit modal handlers
  function openEditModal(id: number, name: string, jobdesk: string, shift: string) {
    setEditId(id);
    setEditName(name);
    setEditJobdesk(jobdesk);
    setEditShift((SHIFTS.includes(shift as Shift) ? shift : "PAGI") as Shift);
    setEditNewJobdeskMode(false);
    setEditNewJobdeskText("");
    setShowEditModal(true);
  }

  function handleEdit() {
    if (!editId) return;
    const nameVal = editName.trim();
    const jobdeskVal = editNewJobdeskMode ? editNewJobdeskText.trim() : editJobdesk;
    if (!nameVal || !jobdeskVal) return;
    if (editNewJobdeskMode && !allJobdesks.includes(jobdeskVal)) {
      addToMaster(jobdeskVal);
    }
    updateStaff({ id: editId, name: nameVal, jobdesk: jobdeskVal, shift: editShift }, {
      onSuccess: () => setShowEditModal(false),
    });
  }

  const showActionCol = canEdit || canDelete;

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
                    JABATAN
                  </h1>
                </div>
                <p className="text-muted-foreground text-sm">Daftar staff per shift & jabatan</p>
              </div>
              <div className="flex items-center gap-3">
                {canAdd && (
                  <Button
                    size="sm"
                    onClick={openAddModal}
                    className="h-8 px-3 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs"
                    data-testid="button-add-staff"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    Tambah Staff
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowManage(prev => !prev)}
                    className="h-8 px-3 rounded-lg border border-white/10 text-muted-foreground hover:text-primary hover:border-primary/30 text-xs"
                    data-testid="button-manage-jobdesks"
                  >
                    <Settings2 className="w-3.5 h-3.5 mr-1.5" />
                    Kelola Jabatan
                    {showManage ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                  </Button>
                )}
                <p className="text-primary/80 font-semibold text-sm" data-testid="text-date">{today}</p>
              </div>
            </div>
          </div>

          {/* Manage Jobdesk Panel (admin only) */}
          {isAdmin && showManage && (
            <div className="mx-6 mt-4 p-4 rounded-2xl border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <Settings2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary uppercase tracking-wider">Daftar Master Jabatan</span>
                <span className="text-xs text-muted-foreground ml-1">— klik X untuk hapus dari daftar</span>
              </div>
              {allJobdesks.length === 0 ? (
                <p className="text-xs text-muted-foreground">Belum ada jabatan terdaftar.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allJobdesks.map(j => (
                    <div
                      key={j}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-sm font-medium text-primary"
                      data-testid={`chip-jobdesk-${j}`}
                    >
                      <span>{j}</span>
                      {confirmDeleteJobdesk === j ? (
                        <>
                          <button
                            onClick={() => { deleteFromMaster(j); setConfirmDeleteJobdesk(null); }}
                            disabled={isDeletingJobdesk}
                            className="text-red-400 hover:text-red-300 text-xs font-bold ml-1"
                            data-testid={`button-confirm-delete-chip-${j}`}
                          >
                            Hapus
                          </button>
                          <button
                            onClick={() => setConfirmDeleteJobdesk(null)}
                            className="text-muted-foreground hover:text-foreground"
                            data-testid={`button-cancel-delete-chip-${j}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteJobdesk(j)}
                          className="text-primary/50 hover:text-red-400 transition-colors ml-0.5"
                          title={`Hapus jabatan "${j}"`}
                          data-testid={`button-delete-chip-${j}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground/60 mt-3">
                Jabatan yang dihapus dari daftar tidak lagi muncul sebagai pilihan, namun tidak mengubah data staff yang sudah terlanjur di-assign.
              </p>
            </div>
          )}

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
                    JABATAN {activeShift}
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
              <div className={`grid ${showActionCol ? "grid-cols-[1fr_130px_1fr_80px]" : "grid-cols-[1fr_130px_1fr]"} px-6 py-3 border-b border-white/10 bg-primary/5`}>
                <span className="text-xs font-bold text-primary/70 uppercase tracking-widest">Nama Staff</span>
                <span className="text-xs font-bold text-primary/70 uppercase tracking-widest">Shift</span>
                <span className="text-xs font-bold text-primary/70 uppercase tracking-widest">Jabatan</span>
                {showActionCol && (
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
                    className={`grid ${showActionCol ? "grid-cols-[1fr_130px_1fr_80px]" : "grid-cols-[1fr_130px_1fr]"} items-center px-6 py-3 border-b border-white/5 hover:bg-primary/5 transition-colors ${
                      i % 2 === 0 ? "bg-background/20" : "bg-background/10"
                    }`}
                    data-testid={`row-jobdesk-${s.id}`}
                  >
                    <span className="font-bold text-foreground uppercase tracking-wide text-sm">{s.name}</span>

                    {/* Shift cell — inline dropdown for canEdit users */}
                    {canEdit ? (
                      <Select
                        value={s.shift}
                        onValueChange={(newShift) => {
                          updateStaff({ id: s.id, name: s.name, jobdesk: s.jobdesk, shift: newShift });
                        }}
                      >
                        <SelectTrigger
                          className="h-7 w-[110px] text-xs font-bold border border-white/10 bg-white/5 px-2 hover:bg-primary/10 rounded-lg focus:ring-0 focus:ring-offset-0"
                          data-testid={`select-shift-${s.id}`}
                        >
                          <span className={
                            s.shift === "PAGI" ? "text-amber-400" :
                            s.shift === "SORE" ? "text-orange-400" :
                            "text-blue-400"
                          }>{s.shift}</span>
                        </SelectTrigger>
                        <SelectContent>
                          {SHIFTS.map(sh => (
                            <SelectItem key={sh} value={sh} className="text-xs font-bold">
                              <span className={`px-2 py-0.5 rounded-md ${
                                sh === "PAGI" ? "text-amber-400" :
                                sh === "SORE" ? "text-orange-400" :
                                "text-blue-400"
                              }`}>{sh}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg w-fit ${
                        s.shift === "PAGI" ? "bg-amber-500/20 text-amber-400" :
                        s.shift === "SORE" ? "bg-orange-500/20 text-orange-400" :
                        "bg-blue-500/20 text-blue-400"
                      }`}>
                        {s.shift}
                      </span>
                    )}

                    <span className="text-muted-foreground font-medium text-sm">{s.jobdesk}</span>

                    {showActionCol && (
                      <div className="flex items-center justify-end gap-1">
                        {confirmDeleteId === s.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-red-400 font-medium">Hapus?</span>
                            <Button
                              size="sm"
                              onClick={() => { deleteStaff(s.id); setConfirmDeleteId(null); }}
                              disabled={isDeleting}
                              className="h-7 px-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-xs"
                              data-testid={`button-confirm-delete-${s.id}`}
                            >
                              Ya
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmDeleteId(null)}
                              className="h-7 px-2 rounded-lg text-muted-foreground hover:text-foreground text-xs"
                              data-testid={`button-cancel-delete-${s.id}`}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            {canEdit && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEditModal(s.id, s.name, s.jobdesk, s.shift)}
                                className="h-7 px-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 text-xs"
                                data-testid={`button-edit-staff-${s.id}`}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmDeleteId(s.id)}
                                className="h-7 px-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 text-xs"
                                data-testid={`button-delete-staff-${s.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </>
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

      {/* Add Staff Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md bg-card border border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary font-display">
              <UserPlus className="w-5 h-5" />
              Tambah Staff Baru
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama Staff</label>
              <Input
                placeholder="Masukkan nama staff..."
                value={addName}
                onChange={e => setAddName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
                className="bg-background/50 border-white/10 focus-visible:ring-primary/30"
                data-testid="input-add-name"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shift</label>
              <Select value={addShift} onValueChange={(v) => setAddShift(v as Shift)}>
                <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-add-shift">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIFTS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jabatan</label>
              {addNewJobdeskMode ? (
                <div className="flex gap-2">
                  <Input
                    autoFocus
                    placeholder="Ketik jabatan baru..."
                    value={addNewJobdeskText}
                    onChange={e => setAddNewJobdeskText(e.target.value)}
                    className="bg-background/50 border-white/10 focus-visible:ring-primary/30"
                    data-testid="input-add-new-jobdesk"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setAddNewJobdeskMode(false); setAddNewJobdeskText(""); }}
                    className="shrink-0"
                    data-testid="button-cancel-new-jobdesk-add"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Select value={addJobdesk} onValueChange={(v) => {
                  if (v === "__new__") { setAddNewJobdeskMode(true); setAddNewJobdeskText(""); }
                  else setAddJobdesk(v);
                }}>
                  <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-add-jobdesk">
                    <SelectValue placeholder="Pilih jobdesk..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allJobdesks.map(j => (
                      <SelectItem key={j} value={j}>{j}</SelectItem>
                    ))}
                    <div className="border-t border-white/10 my-1" />
                    <SelectItem value="__new__" className="text-primary">
                      <span className="flex items-center gap-1"><Plus className="w-3 h-3" /> Jabatan Baru</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowAddModal(false)}
              className="text-muted-foreground"
              data-testid="button-cancel-add-staff"
            >
              Batal
            </Button>
            <Button
              onClick={handleAdd}
              disabled={isCreating || !addName.trim() || !(addNewJobdeskMode ? addNewJobdeskText.trim() : addJobdesk)}
              className="bg-primary hover:bg-primary/80"
              data-testid="button-confirm-add-staff"
            >
              {isCreating ? "Menyimpan..." : "Tambah Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md bg-card border border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary font-display">
              <Pencil className="w-5 h-5" />
              Edit Staff
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama Staff</label>
              <Input
                placeholder="Masukkan nama staff..."
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="bg-background/50 border-white/10 focus-visible:ring-primary/30"
                data-testid="input-edit-name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shift</label>
              <Select value={editShift} onValueChange={(v) => setEditShift(v as Shift)}>
                <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-edit-shift">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIFTS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jabatan</label>
              {editNewJobdeskMode ? (
                <div className="flex gap-2">
                  <Input
                    autoFocus
                    placeholder="Ketik jabatan baru..."
                    value={editNewJobdeskText}
                    onChange={e => setEditNewJobdeskText(e.target.value)}
                    className="bg-background/50 border-white/10 focus-visible:ring-primary/30"
                    data-testid="input-edit-new-jobdesk"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setEditNewJobdeskMode(false); setEditNewJobdeskText(""); }}
                    className="shrink-0"
                    data-testid="button-cancel-new-jobdesk-edit"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Select value={editJobdesk} onValueChange={(v) => {
                  if (v === "__new__") { setEditNewJobdeskMode(true); setEditNewJobdeskText(""); }
                  else setEditJobdesk(v);
                }}>
                  <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-edit-jobdesk">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allJobdesks.map(j => (
                      <SelectItem key={j} value={j}>{j}</SelectItem>
                    ))}
                    <div className="border-t border-white/10 my-1" />
                    <SelectItem value="__new__" className="text-primary">
                      <span className="flex items-center gap-1"><Plus className="w-3 h-3" /> Jabatan Baru</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowEditModal(false)}
              className="text-muted-foreground"
              data-testid="button-cancel-edit-staff"
            >
              Batal
            </Button>
            <Button
              onClick={handleEdit}
              disabled={isSaving || !editName.trim() || !(editNewJobdeskMode ? editNewJobdeskText.trim() : editJobdesk)}
              className="bg-primary hover:bg-primary/80"
              data-testid="button-confirm-edit-staff"
            >
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
