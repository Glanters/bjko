import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { User, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [newUsername, setNewUsername] = useState("");
  const [editingUsername, setEditingUsername] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [editingPassword, setEditingPassword] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const updateUsernameMutation = useMutation({
    mutationFn: (username: string) =>
      apiRequest("PATCH", api.users.updateUsername.path.replace(":id", String(user!.id)), { username }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      toast({ title: "Berhasil", description: "Username berhasil diperbarui" });
      setEditingUsername(false);
      setNewUsername("");
    },
    onError: (err: any) => {
      toast({ title: "Gagal", description: err?.message || "Gagal memperbarui username", variant: "destructive" });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (password: string) =>
      apiRequest("PATCH", api.users.updatePassword.path.replace(":id", String(user!.id)), { password }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      toast({ title: "Berhasil", description: "Password berhasil diperbarui" });
      setEditingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: any) => {
      toast({ title: "Gagal", description: err?.message || "Gagal memperbarui password", variant: "destructive" });
    },
  });

  if (!user) return null;

  const handleSaveUsername = () => {
    if (!newUsername.trim()) return;
    updateUsernameMutation.mutate(newUsername.trim());
  };

  const handleSavePassword = () => {
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password minimal 6 karakter", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Konfirmasi password tidak cocok", variant: "destructive" });
      return;
    }
    if (currentPassword !== user.password) {
      toast({ title: "Error", description: "Password lama tidak sesuai", variant: "destructive" });
      return;
    }
    updatePasswordMutation.mutate(newPassword);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 relative z-10 max-w-2xl">
        <div className="mb-8">
          <h2 className="text-3xl font-display font-bold text-gradient">Profil Saya</h2>
          <p className="text-muted-foreground mt-2">Kelola informasi akun Anda</p>
        </div>

        {/* Profile Card */}
        <div className="glass-panel rounded-2xl p-6 mb-6 border border-white/5">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold" data-testid="text-profile-username">{user.username}</h3>
                <Badge
                  className={user.role === "admin"
                    ? "bg-primary/20 text-primary border-primary/30 uppercase text-xs"
                    : "bg-green-500/20 text-green-400 border-green-500/30 uppercase text-xs"
                  }
                >
                  {user.role === "admin" ? "Master" : "Agent"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {user.role === "admin" ? "Akses penuh" : "Akses terbatas"}
              </p>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Username</p>
              <p className="font-medium">{user.username}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Role</p>
              <p className="font-medium capitalize">{user.role === "admin" ? "Master Admin" : "Agent"}</p>
            </div>
          </div>
        </div>

        {/* Change Username */}
        <div className="glass-panel rounded-2xl p-6 mb-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Ganti Username</h4>
            </div>
            {!editingUsername && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setEditingUsername(true); setNewUsername(user.username); }}
                className="rounded-lg border-white/10 hover:border-primary/50"
                data-testid="button-edit-username"
              >
                Edit
              </Button>
            )}
          </div>

          {editingUsername ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Username Baru</label>
                <Input
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="Masukkan username baru"
                  className="bg-black/20 border-white/10"
                  data-testid="input-new-username"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveUsername}
                  disabled={updateUsernameMutation.isPending || !newUsername.trim()}
                  className="bg-primary/80 hover:bg-primary"
                  data-testid="button-save-username"
                >
                  {updateUsernameMutation.isPending ? "Menyimpan..." : (
                    <><CheckCircle2 className="w-4 h-4 mr-1.5" />Simpan</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setEditingUsername(false); setNewUsername(""); }}
                  className="border-white/10"
                  data-testid="button-cancel-username"
                >
                  Batal
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Username saat ini: <span className="text-foreground font-medium">{user.username}</span></p>
          )}
        </div>

        {/* Change Password */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Ganti Password</h4>
            </div>
            {!editingPassword && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingPassword(true)}
                className="rounded-lg border-white/10 hover:border-primary/50"
                data-testid="button-edit-password"
              >
                Edit
              </Button>
            )}
          </div>

          {editingPassword ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Password Lama</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan password lama"
                  className="bg-black/20 border-white/10"
                  data-testid="input-current-password"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Password Baru (min. 6 karakter)</label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Masukkan password baru"
                    className="bg-black/20 border-white/10 pr-10"
                    data-testid="input-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Konfirmasi Password Baru</label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="bg-black/20 border-white/10 pr-10"
                    data-testid="input-confirm-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">Password tidak cocok</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSavePassword}
                  disabled={updatePasswordMutation.isPending || !newPassword || !currentPassword || newPassword !== confirmPassword}
                  className="bg-primary/80 hover:bg-primary"
                  data-testid="button-save-password"
                >
                  {updatePasswordMutation.isPending ? "Menyimpan..." : (
                    <><CheckCircle2 className="w-4 h-4 mr-1.5" />Simpan</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingPassword(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="border-white/10"
                  data-testid="button-cancel-password"
                >
                  Batal
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Password: <span className="text-foreground font-medium">••••••••</span></p>
          )}
        </div>
      </main>
    </div>
  );
}
