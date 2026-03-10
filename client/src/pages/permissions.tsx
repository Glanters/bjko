import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, UserCheck, Trash2, Save } from "lucide-react";
import type { User } from "@shared/schema";
import type { StaffPermission } from "@shared/schema";

const SHIFTS = ["PAGI", "SORE", "MALAM"];
const JOBDESKS = ["CS LINE", "CS", "KAPTEN", "KASIR"];

function parseList(val: string): string[] {
  return val ? val.split(",").filter(Boolean) : [];
}

function toList(arr: string[]): string {
  return arr.join(",");
}

function PermissionRow({ user, perm, onSave, onDelete }: {
  user: User;
  perm: StaffPermission | undefined;
  onSave: (userId: number, data: { canAddStaff: boolean; allowedShifts: string; allowedJobdesks: string; canEditJobdesk: boolean }) => void;
  onDelete: (userId: number) => void;
}) {
  const [canAdd, setCanAdd] = useState(perm?.canAddStaff ?? false);
  const [canEditJobdesk, setCanEditJobdesk] = useState(perm?.canEditJobdesk ?? false);
  const [shifts, setShifts] = useState<string[]>(parseList(perm?.allowedShifts ?? ""));
  const [jobdesks, setJobdesks] = useState<string[]>(parseList(perm?.allowedJobdesks ?? ""));

  const toggleShift = (s: string) => setShifts(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleJobdesk = (j: string) => setJobdesks(prev => prev.includes(j) ? prev.filter(x => x !== j) : [...prev, j]);

  return (
    <div className="glass-panel rounded-2xl border border-white/10 p-5 space-y-4" data-testid={`perm-row-${user.id}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary">{user.username.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="font-semibold text-sm">{user.username}</p>
            <Badge variant="outline" className="text-[10px] uppercase">{user.role}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onSave(user.id, { canAddStaff: canAdd, allowedShifts: toList(shifts), allowedJobdesks: toList(jobdesks), canEditJobdesk })}
            className="h-8 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs"
            data-testid={`button-save-perm-${user.id}`}
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            Simpan
          </Button>
          {perm && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(user.id)}
              className="h-8 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-muted-foreground text-xs"
              data-testid={`button-delete-perm-${user.id}`}
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
            id={`can-add-${user.id}`}
            checked={canAdd}
            onCheckedChange={(v) => setCanAdd(!!v)}
            data-testid={`checkbox-can-add-${user.id}`}
          />
          <label htmlFor={`can-add-${user.id}`} className="text-sm font-medium cursor-pointer">
            Dapat Menambahkan Staff
          </label>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
          <Checkbox
            id={`can-edit-jobdesk-${user.id}`}
            checked={canEditJobdesk}
            onCheckedChange={(v) => setCanEditJobdesk(!!v)}
            data-testid={`checkbox-can-edit-jobdesk-${user.id}`}
          />
          <label htmlFor={`can-edit-jobdesk-${user.id}`} className="text-sm font-medium cursor-pointer">
            Dapat Edit Jobdesk Staff
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
              data-testid={`shift-${s}-${user.id}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Allowed Jobdesks */}
      <div>
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Jobdesk yang Diizinkan</p>
        <div className="flex gap-2 flex-wrap">
          {JOBDESKS.map(j => (
            <button
              key={j}
              onClick={() => toggleJobdesk(j)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                jobdesks.includes(j)
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
              }`}
              data-testid={`jobdesk-${j}-${user.id}`}
            >
              {j}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Permissions() {
  const { toast } = useToast();

  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: perms } = useQuery<StaffPermission[]>({ queryKey: ["/api/permissions"] });

  const saveMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: any }) =>
      apiRequest("POST", `/api/permissions/${userId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      toast({ title: "Izin disimpan" });
    },
    onError: () => toast({ title: "Gagal menyimpan izin", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: number) => apiRequest("DELETE", `/api/permissions/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      toast({ title: "Izin dihapus" });
    },
    onError: () => toast({ title: "Gagal menghapus izin", variant: "destructive" }),
  });

  const agentUsers = (users ?? []).filter(u => u.role !== "admin");

  const getPermForUser = (userId: number) => (perms ?? []).find(p => p.userId === userId);

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
              Manajemen Izin Edit Staff
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Atur siapa saja yang bisa menambahkan staff, shift apa, dan jobdesk apa.
              Jika tidak ada izin dari admin master, user tidak dapat melakukan edit.
            </p>
          </div>

          {agentUsers.length === 0 ? (
            <div className="glass-panel rounded-2xl border border-white/10 p-12 text-center text-muted-foreground">
              <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Belum ada user agent terdaftar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {agentUsers.map(user => (
                <PermissionRow
                  key={user.id}
                  user={user}
                  perm={getPermForUser(user.id)}
                  onSave={(userId, data) => saveMutation.mutate({ userId, data })}
                  onDelete={(userId) => deleteMutation.mutate(userId)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
