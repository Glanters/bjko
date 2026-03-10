import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Layers, Trash2, Save, ChevronDown, Check, Briefcase } from "lucide-react";
import type { StaffPermission } from "@shared/schema";

const SHIFTS = ["PAGI", "SORE", "MALAM"];

function parseList(val: string): string[] {
  return val ? val.split(",").filter(Boolean) : [];
}

function toList(arr: string[]): string {
  return arr.join(",");
}

function PermissionRoleRow({ role, perm, allJobdesks, onSave, onDelete }: {
  role: string;
  perm: StaffPermission | undefined;
  allJobdesks: string[];
  onSave: (role: string, data: { canAddStaff: boolean; allowedShifts: string; allowedJobdesks: string; canEditJobdesk: boolean; canDeleteStaff: boolean; canEditName: boolean; canEditPassword: boolean }) => void;
  onDelete: (role: string) => void;
}) {
  const [canAdd, setCanAdd] = useState(perm?.canAddStaff ?? false);
  const [canEditJobdesk, setCanEditJobdesk] = useState(perm?.canEditJobdesk ?? false);
  const [canDelete, setCanDelete] = useState(perm?.canDeleteStaff ?? false);
  const [canEditName, setCanEditName] = useState(perm?.canEditName ?? false);
  const [canEditPassword, setCanEditPassword] = useState(perm?.canEditPassword ?? false);
  const [shifts, setShifts] = useState<string[]>(parseList(perm?.allowedShifts ?? ""));
  const [jobdesks, setJobdesks] = useState<string[]>(parseList(perm?.allowedJobdesks ?? ""));

  const toggleShift = (s: string) => setShifts(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleJobdesk = (j: string) => setJobdesks(prev => prev.includes(j) ? prev.filter(x => x !== j) : [...prev, j]);

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <div className="glass-panel rounded-2xl border border-white/10 p-5 space-y-4" data-testid={`perm-row-${role}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm uppercase tracking-wider">{roleLabel}</p>
            <Badge variant="outline" className="text-[10px] uppercase mt-0.5">{role}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onSave(role, { canAddStaff: canAdd, allowedShifts: toList(shifts), allowedJobdesks: toList(jobdesks), canEditJobdesk, canDeleteStaff: canDelete, canEditName, canEditPassword })}
            className="h-8 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs"
            data-testid={`button-save-perm-${role}`}
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            Simpan
          </Button>
          {perm && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(role)}
              className="h-8 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-muted-foreground text-xs"
              data-testid={`button-delete-perm-${role}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Permissions checkboxes */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
          <Checkbox
            id={`can-add-${role}`}
            checked={canAdd}
            onCheckedChange={(v) => setCanAdd(!!v)}
            data-testid={`checkbox-can-add-${role}`}
          />
          <label htmlFor={`can-add-${role}`} className="text-sm font-medium cursor-pointer">
            Dapat Menambahkan Staff
          </label>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
          <Checkbox
            id={`can-edit-jobdesk-${role}`}
            checked={canEditJobdesk}
            onCheckedChange={(v) => setCanEditJobdesk(!!v)}
            data-testid={`checkbox-can-edit-jobdesk-${role}`}
          />
          <label htmlFor={`can-edit-jobdesk-${role}`} className="text-sm font-medium cursor-pointer">
            Dapat Edit Jobdesk Staff
          </label>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
          <Checkbox
            id={`can-delete-${role}`}
            checked={canDelete}
            onCheckedChange={(v) => setCanDelete(!!v)}
            data-testid={`checkbox-can-delete-${role}`}
          />
          <label htmlFor={`can-delete-${role}`} className="text-sm font-medium cursor-pointer">
            Dapat Hapus Staff
          </label>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
          <Checkbox
            id={`can-edit-name-${role}`}
            checked={canEditName}
            onCheckedChange={(v) => setCanEditName(!!v)}
            data-testid={`checkbox-can-edit-name-${role}`}
          />
          <label htmlFor={`can-edit-name-${role}`} className="text-sm font-medium cursor-pointer">
            Dapat Mengubah User
          </label>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
          <Checkbox
            id={`can-edit-password-${role}`}
            checked={canEditPassword}
            onCheckedChange={(v) => setCanEditPassword(!!v)}
            data-testid={`checkbox-can-edit-password-${role}`}
          />
          <label htmlFor={`can-edit-password-${role}`} className="text-sm font-medium cursor-pointer">
            Dapat Mengubah Password
          </label>
        </div>
      </div>

      {/* Allowed Shifts */}
      <div>
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Shift yang Diizinkan</p>
        <div className="flex gap-2 flex-wrap">
          {SHIFTS.map(s => (
            <button
              key={s}
              onClick={() => toggleShift(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                shifts.includes(s)
                  ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-300"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
              }`}
              data-testid={`shift-${s}-${role}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Allowed Jobdesks — multi-select dropdown */}
      {allJobdesks.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Jabatan yang Diizinkan</p>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                data-testid={`dropdown-jobdesk-${role}`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Briefcase className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                  {jobdesks.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Pilih jobdesk yang diizinkan...</span>
                  ) : (
                    <div className="flex gap-1.5 flex-wrap">
                      {jobdesks.map(j => (
                        <span
                          key={j}
                          className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/20 border border-primary/30 text-primary text-[11px] font-bold"
                        >
                          {j}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 p-2 bg-card border border-white/10 shadow-xl rounded-xl"
              align="start"
              data-testid={`popover-jobdesk-${role}`}
            >
              <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest px-2 pb-2 border-b border-white/10 mb-1">
                Pilih Jobdesk
              </p>
              <div className="max-h-52 overflow-y-auto space-y-0.5 pr-1">
                {allJobdesks.map(j => {
                  const selected = jobdesks.includes(j);
                  return (
                    <button
                      key={j}
                      onClick={() => toggleJobdesk(j)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                        selected
                          ? "bg-primary/20 text-primary"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      }`}
                      data-testid={`jobdesk-${j}-${role}`}
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                        selected ? "bg-primary border-primary" : "border-white/20 bg-white/5"
                      }`}>
                        {selected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                      </span>
                      {j}
                    </button>
                  );
                })}
              </div>
              {jobdesks.length > 0 && (
                <div className="border-t border-white/10 mt-1 pt-1">
                  <button
                    onClick={() => setJobdesks([])}
                    className="w-full text-center text-[11px] text-red-400/70 hover:text-red-400 py-1 transition-colors"
                    data-testid={`clear-jobdesks-${role}`}
                  >
                    Hapus semua pilihan
                  </button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}

export default function Permissions() {
  const { toast } = useToast();

  const { data: perms } = useQuery<StaffPermission[]>({ queryKey: ["/api/permissions"] });
  const { data: masterData } = useQuery<{ jobdesks: string[] }>({ queryKey: ["/api/jobdeskList"] });
  const { data: staffData } = useQuery<Array<{ jobdesk: string }>>({ queryKey: ["/api/staff"] });

  const saveMutation = useMutation({
    mutationFn: ({ role, data }: { role: string; data: any }) =>
      apiRequest("POST", `/api/permissions/${role}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      toast({ title: "Izin disimpan" });
    },
    onError: () => toast({ title: "Gagal menyimpan izin", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (role: string) => apiRequest("DELETE", `/api/permissions/${role}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      toast({ title: "Izin dihapus" });
    },
    onError: () => toast({ title: "Gagal menghapus izin", variant: "destructive" }),
  });

  const allJobdesks = useMemo(() => {
    const masterList = masterData?.jobdesks ?? [];
    const staffList = (staffData ?? []).map(s => s.jobdesk).filter(Boolean);
    return Array.from(new Set([...masterList, ...staffList])).filter(Boolean).sort();
  }, [masterData, staffData]);

  const uniqueNonAdminRoles = allJobdesks;

  const getPermForRole = (role: string) => (perms ?? []).find(p => p.role === role);

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto px-4 py-6 relative z-10">
          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold text-gradient flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              Manajemen Izin per Jabatan
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Atur izin berdasarkan jabatan staff. Setiap jabatan memiliki pengaturan akses yang terpisah dan independen.
            </p>
          </div>

          {uniqueNonAdminRoles.length === 0 ? (
            <div className="glass-panel rounded-2xl border border-white/10 p-12 text-center text-muted-foreground">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Belum ada jabatan terdaftar. Tambahkan jabatan di halaman Jobdesk terlebih dahulu.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {uniqueNonAdminRoles.map(role => (
                <PermissionRoleRow
                  key={role}
                  role={role}
                  perm={getPermForRole(role)}
                  allJobdesks={allJobdesks}
                  onSave={(r, data) => saveMutation.mutate({ role: r, data })}
                  onDelete={(r) => deleteMutation.mutate(r)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
