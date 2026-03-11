import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useRef } from "react";
import { Camera, Trash2, ShieldCheck, Upload, Eye, EyeOff, KeyRound, UserPen } from "lucide-react";
import type { StaffPermission } from "@shared/schema";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [newUsername, setNewUsername] = useState("");

  const { data: myPerm } = useQuery<StaffPermission | null>({
    queryKey: ["/api/permissions/me"],
    staleTime: 0,
    enabled: !!user && user.role !== "admin",
  });

  const isAdmin = user?.role === "admin";
  const canEditPassword = isAdmin || !!myPerm?.canEditPassword;
  const canEditName = isAdmin || !!myPerm?.canEditName;

  const updateAvatarMutation = useMutation({
    mutationFn: (avatarUrl: string) =>
      apiRequest("PATCH", api.users.updateAvatar.path.replace(":id", String(user!.id)), { avatarUrl }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      toast({ title: "Berhasil", description: "Foto profil berhasil diperbarui" });
      setPreview(null);
    },
    onError: (err: any) => {
      toast({ title: "Gagal", description: err?.message || "Gagal memperbarui foto", variant: "destructive" });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (password: string) =>
      apiRequest("PATCH", api.users.updatePassword.path.replace(":id", String(user!.id)), { password }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Password berhasil diperbarui" });
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: any) => {
      toast({ title: "Gagal", description: err?.message || "Gagal memperbarui password", variant: "destructive" });
    },
  });

  const updateUsernameMutation = useMutation({
    mutationFn: (username: string) =>
      apiRequest("PATCH", api.users.updateUsername.path.replace(":id", String(user!.id)), { username }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      toast({ title: "Berhasil", description: "Nama akun berhasil diperbarui" });
      setNewUsername("");
    },
    onError: (err: any) => {
      toast({ title: "Gagal", description: err?.message || "Gagal memperbarui nama akun", variant: "destructive" });
    },
  });

  const handleSavePassword = () => {
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password minimal 6 karakter", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Konfirmasi password tidak cocok", variant: "destructive" });
      return;
    }
    updatePasswordMutation.mutate(newPassword);
  };

  const handleSaveUsername = () => {
    const val = newUsername.trim();
    if (!val || val.length < 1) {
      toast({ title: "Error", description: "Nama akun tidak boleh kosong", variant: "destructive" });
      return;
    }
    updateUsernameMutation.mutate(val);
  };

  if (!user) return null;

  const currentAvatar = preview || user.avatarUrl || null;
  const initial = user.username.charAt(0).toUpperCase();

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "File harus berupa gambar (JPG, PNG, GIF, dll)", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Error", description: "Ukuran file maksimal 2MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleSave = () => {
    if (!preview) return;
    updateAvatarMutation.mutate(preview);
  };

  const handleRemove = () => {
    updateAvatarMutation.mutate("");
    setPreview(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 relative z-10 max-w-lg">
        <div className="mb-8">
          <h2 className="text-3xl font-display font-bold text-gradient">Profil Saya</h2>
          <p className="text-muted-foreground mt-2">Kelola akun dan foto profil Anda</p>
        </div>

        {/* Profile Card */}
        <div className="glass-panel rounded-2xl p-8 border border-white/5">
          {/* Current Avatar Display */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-primary/30 shadow-lg shadow-primary/20">
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt="Foto profil"
                    className="w-full h-full object-cover"
                    data-testid="img-avatar-preview"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">{initial}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary border-2 border-background flex items-center justify-center hover:bg-primary/80 transition-colors"
                data-testid="button-change-photo"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-xl font-bold" data-testid="text-username">{user.username}</h3>
                <Badge
                  className={user.role === "admin"
                    ? "bg-primary/20 text-primary border-primary/30 uppercase text-xs"
                    : "bg-green-500/20 text-green-400 border-green-500/30 uppercase text-xs"
                  }
                >
                  {user.role === "admin" ? "Master" : "Agent"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {user.role === "admin" ? "Akses penuh" : "Akses terbatas"}
              </p>
            </div>
          </div>

          {/* Upload Area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${isDragging
                ? "border-primary bg-primary/10"
                : "border-white/10 hover:border-primary/50 hover:bg-primary/5"
              }`}
            data-testid="dropzone-avatar"
          >
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">Klik atau seret foto ke sini</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, GIF — Maks. 2MB</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
            data-testid="input-file-avatar"
          />

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            {preview ? (
              <>
                <Button
                  onClick={handleSave}
                  disabled={updateAvatarMutation.isPending}
                  className="flex-1 bg-primary/80 hover:bg-primary"
                  data-testid="button-save-avatar"
                >
                  {updateAvatarMutation.isPending ? "Menyimpan..." : "Simpan Foto"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="border-white/10"
                  data-testid="button-cancel-avatar"
                >
                  Batal
                </Button>
              </>
            ) : user.avatarUrl ? (
              <Button
                variant="outline"
                onClick={handleRemove}
                disabled={updateAvatarMutation.isPending}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                data-testid="button-remove-avatar"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus Foto
              </Button>
            ) : null}
          </div>
        </div>

        {/* Change Name Card */}
        {canEditName ? (
          <div className="glass-panel rounded-2xl p-8 border border-white/5 mt-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <UserPen className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Ubah Nama Akun</h3>
                <p className="text-xs text-muted-foreground">Nama saat ini: <span className="font-medium text-foreground">{user.username}</span></p>
              </div>
            </div>

            <div className="space-y-3">
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Nama akun baru"
                className="bg-white/5 border-white/10"
                data-testid="input-new-username"
              />
              <Button
                onClick={handleSaveUsername}
                disabled={updateUsernameMutation.isPending || !newUsername.trim()}
                className="w-full bg-blue-500/80 hover:bg-blue-500 text-white"
                data-testid="button-save-username"
              >
                {updateUsernameMutation.isPending ? "Menyimpan..." : "Simpan Nama"}
              </Button>
            </div>
          </div>
        ) : !isAdmin && (
          <div className="glass-panel rounded-2xl p-5 border border-white/5 mt-6 opacity-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                <UserPen className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-muted-foreground">Ubah Nama Akun</h3>
                <p className="text-xs text-muted-foreground">Tidak memiliki izin — hubungi admin</p>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Card */}
        {canEditPassword ? (
          <div className="glass-panel rounded-2xl p-8 border border-white/5 mt-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Ganti Password</h3>
                <p className="text-xs text-muted-foreground">Password minimal 6 karakter</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Input
                  type={showNewPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Password baru"
                  className="pr-10 bg-white/5 border-white/10"
                  data-testid="input-new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  type={showConfirmPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Konfirmasi password baru"
                  className="pr-10 bg-white/5 border-white/10"
                  data-testid="input-confirm-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-400">Password tidak cocok</p>
              )}

              <Button
                onClick={handleSavePassword}
                disabled={updatePasswordMutation.isPending || !newPassword || !confirmPassword}
                className="w-full bg-primary/80 hover:bg-primary"
                data-testid="button-save-password"
              >
                {updatePasswordMutation.isPending ? "Menyimpan..." : "Simpan Password"}
              </Button>
            </div>
          </div>
        ) : !isAdmin && (
          <div className="glass-panel rounded-2xl p-5 border border-white/5 mt-6 opacity-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-muted-foreground">Ganti Password</h3>
                <p className="text-xs text-muted-foreground">Tidak memiliki izin — hubungi admin</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
