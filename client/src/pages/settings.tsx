import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Loader2, Eye, EyeOff, Trash2, UserX, Palette, RotateCcw, Check, Layers, Plus, AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { useJobdeskLimits, useUpdateJobdeskLimits } from "@/hooks/use-jobdesk-limits";
import { useDeleteUser } from "@/hooks/use-delete-user";
import { hslToHex, hexToHsl, applyCustomColors } from "@/components/theme-provider";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingIp, setEditingIp] = useState<string>("");
  const [bulkIp, setBulkIp] = useState<string>("");
  const [showBulkIpConfirm, setShowBulkIpConfirm] = useState<boolean>(false);
  const [bulkPassword, setBulkPassword] = useState<string>("");
  const [bulkPasswordConfirm, setBulkPasswordConfirm] = useState<string>("");
  const [showBulkPassConfirm, setShowBulkPassConfirm] = useState<boolean>(false);
  const [showBulkPass, setShowBulkPass] = useState<boolean>(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState<boolean>(false);
  const [showBulkDeleteStaffConfirm, setShowBulkDeleteStaffConfirm] = useState<boolean>(false);
  const [passwordEditingId, setPasswordEditingId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState<string>("");
  const [usernameEditingId, setUsernameEditingId] = useState<number | null>(null);
  const [newUsername, setNewUsername] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [whitelistText, setWhitelistText] = useState<string>("");
  const [editingWhitelist, setEditingWhitelist] = useState<boolean>(false);
  const [jobdeskLimitsText, setJobdeskLimitsText] = useState<string>("");
  const [editingJobdeskLimits, setEditingJobdeskLimits] = useState<boolean>(false);
  const [themeBg, setThemeBg] = useState<string>("");
  const [themePrimary, setThemePrimary] = useState<string>("");
  const [newJabatan, setNewJabatan] = useState<string>("");
  const [showResetJabatanConfirm, setShowResetJabatanConfirm] = useState<boolean>(false);

  const limitsQuery = useJobdeskLimits();
  const updateLimitsMutation = useUpdateJobdeskLimits();
  const { mutate: deleteUser, isPending: isDeletingUser } = useDeleteUser();

  useEffect(() => {
    if (limitsQuery.data?.limits) {
      const text = Object.entries(limitsQuery.data.limits)
        .map(([jobdesk, limit]) => `${jobdesk}=${limit}`)
        .join("\n");
      setJobdeskLimitsText(text);
    }
  }, [limitsQuery.data]);

  const handleSaveJobdeskLimits = () => {
    const limits: Record<string, number> = {};
    jobdeskLimitsText.split("\n").forEach(line => {
      const [jobdesk, limitStr] = line.split("=");
      if (jobdesk && limitStr) {
        limits[jobdesk.trim()] = parseInt(limitStr.trim());
      }
    });
    updateLimitsMutation.mutate(limits);
    setEditingJobdeskLimits(false);
  };

  const usersQuery = useQuery({
    queryKey: [api.users.list.path],
    queryFn: () => apiRequest("GET", api.users.list.path).then(r => r.json()),
    enabled: user?.role === "admin",
  });

  const whitelistQuery = useQuery({
    queryKey: [api.whitelist.get.path],
    queryFn: () => apiRequest("GET", api.whitelist.get.path).then(r => r.json()),
    enabled: user?.role === "admin",
  });

  const themeQuery = useQuery<{ bg: string | null; primary: string | null }>({
    queryKey: ["/api/theme-settings"],
    enabled: user?.role === "admin",
  });

  useEffect(() => {
    if (themeQuery.data) {
      setThemeBg(themeQuery.data.bg ?? "");
      setThemePrimary(themeQuery.data.primary ?? "");
    }
  }, [themeQuery.data]);

  const saveThemeMutation = useMutation({
    mutationFn: (data: { bg: string; primary: string }) =>
      apiRequest("POST", "/api/theme-settings", data).then(r => r.json()),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/theme-settings"] });
      applyCustomColors(data.bg, data.primary);
      toast({ title: "Berhasil", description: "Tema dashboard diperbarui" });
    },
    onError: () => toast({ title: "Error", description: "Gagal menyimpan tema", variant: "destructive" }),
  });

  const resetThemeMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/theme-settings").then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/theme-settings"] });
      setThemeBg("");
      setThemePrimary("");
      applyCustomColors(null, null);
      toast({ title: "Berhasil", description: "Tema direset ke default" });
    },
    onError: () => toast({ title: "Error", description: "Gagal reset tema", variant: "destructive" }),
  });

  const updateIpMutation = useMutation({
    mutationFn: (data: { userId: number; allowedIp: string }) =>
      apiRequest("PATCH", api.users.updateIp.path.replace(":id", String(data.userId)), {
        allowedIp: data.allowedIp,
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      toast({ title: "Berhasil", description: "IP telah diperbarui" });
      setEditingId(null);
      setEditingIp("");
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal memperbarui IP", variant: "destructive" });
    },
  });

  const bulkUpdateIpMutation = useMutation({
    mutationFn: (allowedIp: string) =>
      apiRequest("PATCH", api.users.bulkUpdateIp.path, { allowedIp }).then(r => r.json()),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      toast({ title: "Berhasil", description: data.message });
      setBulkIp("");
      setShowBulkIpConfirm(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal memperbarui IP semua pengguna", variant: "destructive" });
    },
  });

  const bulkUpdatePasswordMutation = useMutation({
    mutationFn: (password: string) =>
      apiRequest("PATCH", api.users.bulkUpdatePassword.path, { password }).then(r => r.json()),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      toast({ title: "Berhasil", description: data.message });
      setBulkPassword("");
      setBulkPasswordConfirm("");
      setShowBulkPassConfirm(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal memperbarui password semua pengguna", variant: "destructive" });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data: { userId: number; password: string }) =>
      apiRequest("PATCH", api.users.updatePassword.path.replace(":id", String(data.userId)), {
        password: data.password,
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      toast({ title: "Berhasil", description: "Password telah diperbarui" });
      setPasswordEditingId(null);
      setNewPassword("");
    },
    onError: (error: any) => {
      const message = error?.message || "Gagal memperbarui password";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const updateUsernameMutation = useMutation({
    mutationFn: (data: { userId: number; username: string }) =>
      apiRequest("PATCH", api.users.updateUsername.path.replace(":id", String(data.userId)), {
        username: data.username,
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      toast({ title: "Berhasil", description: "Username telah diperbarui" });
      setUsernameEditingId(null);
      setNewUsername("");
    },
    onError: (error: any) => {
      const message = error?.message || "Gagal memperbarui username";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const bulkDeleteAllStaffMutation = useMutation({
    mutationFn: () =>
      apiRequest("DELETE", api.staff.bulkDeleteAll.path).then(r => r.json()),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [api.staff.list.path] });
      toast({ title: "Berhasil", description: data.message });
      setShowBulkDeleteStaffConfirm(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal menghapus semua data staff", variant: "destructive" });
    },
  });

  const bulkDeleteAgentsMutation = useMutation({
    mutationFn: () =>
      apiRequest("DELETE", api.users.bulkDeleteAgents.path).then(r => r.json()),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      toast({ title: "Berhasil", description: data.message });
      setShowBulkDeleteConfirm(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal menghapus semua agent", variant: "destructive" });
    },
  });

  const updateWhitelistMutation = useMutation({
    mutationFn: (ips: string[]) =>
      apiRequest("PATCH", api.whitelist.update.path, { ips }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.whitelist.get.path] });
      toast({ title: "Berhasil", description: "Whitelist IP telah diperbarui" });
      setEditingWhitelist(false);
    },
    onError: (error: any) => {
      const message = error?.message || "Gagal memperbarui whitelist";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const jabatanQuery = useQuery<{ jobdesks: string[] }>({
    queryKey: ["/api/jobdeskList"],
    enabled: user?.role === "admin",
  });

  const addJabatanMutation = useMutation({
    mutationFn: (name: string) => apiRequest("POST", "/api/jobdeskList", { name }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobdeskList"] });
      setNewJabatan("");
      toast({ title: "Berhasil", description: "Jabatan ditambahkan ke master list" });
    },
    onError: () => toast({ title: "Error", description: "Gagal menambahkan jabatan", variant: "destructive" }),
  });

  const deleteJabatanMutation = useMutation({
    mutationFn: (name: string) => apiRequest("DELETE", `/api/jobdeskList/${encodeURIComponent(name)}`).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobdeskList"] });
      toast({ title: "Berhasil", description: "Jabatan dihapus dari master list" });
    },
    onError: () => toast({ title: "Error", description: "Gagal menghapus jabatan", variant: "destructive" }),
  });

  const resetJabatanMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/jobdeskList").then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobdeskList"] });
      setShowResetJabatanConfirm(false);
      toast({ title: "Berhasil", description: "Semua jabatan telah dihapus dari master list" });
    },
    onError: () => toast({ title: "Error", description: "Gagal mereset jabatan", variant: "destructive" }),
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Akses Ditolak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Hanya admin yang dapat mengakses halaman ini.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const whitelistIps = whitelistQuery.data?.ips || [];

  const BG_PRESETS = [
    { label: "Navy (Default)", bg: "211 43% 12%", primary: "210 95% 50%" },
    { label: "Dark Indigo", bg: "240 40% 12%", primary: "250 90% 65%" },
    { label: "Dark Teal", bg: "185 43% 10%", primary: "180 90% 45%" },
    { label: "Dark Green", bg: "150 30% 10%", primary: "145 80% 40%" },
    { label: "Dark Purple", bg: "270 30% 12%", primary: "280 85% 60%" },
    { label: "Dark Red", bg: "0 30% 10%", primary: "5 85% 55%" },
    { label: "Dark Amber", bg: "30 43% 10%", primary: "40 90% 55%" },
    { label: "Charcoal", bg: "0 0% 10%", primary: "210 95% 55%" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      <Header />

      <div className="flex-1 overflow-auto p-6 relative z-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pengaturan</h1>
          <p className="text-muted-foreground">Kelola konfigurasi sistem, pengguna, dan whitelist IP</p>
        </div>

        {/* Tema Dashboard */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <CardTitle className="text-primary">Tema Warna Dashboard</CardTitle>
            </div>
            <CardDescription>Ubah warna latar belakang dan warna aksen utama dashboard. Hanya admin yang dapat mengubah ini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Preset swatches */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Pilih Preset Tema</p>
              <div className="grid grid-cols-4 gap-3">
                {BG_PRESETS.map((preset) => {
                  const bgHex = hslToHex(preset.bg);
                  const accentHex = hslToHex(preset.primary);
                  const isActive = themeBg === preset.bg && themePrimary === preset.primary;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => { setThemeBg(preset.bg); setThemePrimary(preset.primary); applyCustomColors(preset.bg, preset.primary); }}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                        isActive ? "border-white shadow-lg shadow-white/20" : "border-transparent"
                      }`}
                      title={preset.label}
                      data-testid={`button-theme-preset-${preset.label.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      <div className="h-16 w-full" style={{ backgroundColor: bgHex }}>
                        <div className="h-6 w-full" style={{ backgroundColor: accentHex, opacity: 0.7 }} />
                        <div className="px-2 pt-1">
                          <div className="h-1.5 rounded-full w-4/5" style={{ backgroundColor: accentHex }} />
                          <div className="h-1 rounded-full w-3/5 mt-1 opacity-40" style={{ backgroundColor: "white" }} />
                        </div>
                      </div>
                      {isActive && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-black" />
                        </div>
                      )}
                      <div className="text-[10px] text-center py-1 font-medium text-muted-foreground">{preset.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom color pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Warna Background (Custom)</p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={themeBg ? hslToHex(themeBg) : "#1b2c3e"}
                    onChange={e => { const v = hexToHsl(e.target.value); setThemeBg(v); applyCustomColors(v, themePrimary); }}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-white/20"
                    data-testid="input-color-bg"
                  />
                  <div className="flex-1">
                    <Input
                      value={themeBg}
                      onChange={e => { setThemeBg(e.target.value); applyCustomColors(e.target.value, themePrimary); }}
                      placeholder="H S% L% (misal: 211 43% 12%)"
                      className="text-sm font-mono h-9"
                      data-testid="input-hsl-bg"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">Format: H S% L%</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Warna Aksen/Primer (Custom)</p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={themePrimary ? hslToHex(themePrimary) : "#0a7ff5"}
                    onChange={e => { const v = hexToHsl(e.target.value); setThemePrimary(v); applyCustomColors(themeBg, v); }}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-white/20"
                    data-testid="input-color-primary"
                  />
                  <div className="flex-1">
                    <Input
                      value={themePrimary}
                      onChange={e => { setThemePrimary(e.target.value); applyCustomColors(themeBg, e.target.value); }}
                      placeholder="H S% L% (misal: 210 95% 50%)"
                      className="text-sm font-mono h-9"
                      data-testid="input-hsl-primary"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">Format: H S% L%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            {(themeBg || themePrimary) && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Preview Langsung</p>
                <div
                  className="rounded-xl overflow-hidden border border-white/10 text-xs"
                  style={{ backgroundColor: themeBg ? `hsl(${themeBg})` : undefined }}
                >
                  {/* Mini header bar */}
                  <div className="flex items-center gap-2 px-4 py-2" style={{ backgroundColor: themePrimary ? `hsla(${themePrimary}/0.15)` : "rgba(255,255,255,0.05)" }}>
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: themePrimary ? `hsl(${themePrimary})` : undefined }} />
                    <span className="font-bold text-[11px]" style={{ color: themePrimary ? `hsl(${themePrimary})` : undefined }}>DASHBOARD BOSJOKO</span>
                  </div>
                  {/* Mini table header */}
                  <div className="flex px-4 py-1.5 gap-4 border-b border-white/10" style={{ backgroundColor: themeBg ? `hsl(${themeBg})` : undefined, opacity: 0.8 }}>
                    <span className="opacity-60 w-24">Nama Staff</span>
                    <span className="opacity-60 w-20">Jobdesk</span>
                    <span className="opacity-60 flex-1 text-right">Aksi</span>
                  </div>
                  {/* Mini table rows */}
                  {[{ name: "Staff Alpha", job: "CS LINE" }, { name: "Staff Beta", job: "kasir" }].map((s, i) => (
                    <div key={i} className="flex px-4 py-2 gap-4 items-center border-b border-white/5" style={{ backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.02)" : undefined }}>
                      <span className="w-24 font-medium opacity-90">{s.name}</span>
                      <span className="w-20 opacity-60">{s.job}</span>
                      <div className="flex-1 flex justify-end">
                        <div className="rounded px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: themePrimary ? `hsl(${themePrimary} / 0.2)` : undefined, color: themePrimary ? `hsl(${themePrimary})` : undefined }}>
                          Mulai Izin
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">Klik "Simpan Tema" untuk terapkan ke semua pengguna.</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={() => saveThemeMutation.mutate({ bg: themeBg, primary: themePrimary })}
                disabled={saveThemeMutation.isPending || (!themeBg && !themePrimary)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-save-theme"
              >
                {saveThemeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Simpan Tema
              </Button>
              <Button
                variant="outline"
                onClick={() => resetThemeMutation.mutate()}
                disabled={resetThemeMutation.isPending}
                className="border-white/20 text-muted-foreground hover:text-foreground"
                data-testid="button-reset-theme"
              >
                {resetThemeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                Reset ke Default
              </Button>
              <p className="text-xs text-muted-foreground">Perubahan langsung terlihat oleh semua pengguna setelah disimpan.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manajemen Pengguna Agent</CardTitle>
            <CardDescription>Edit password, username, dan IP address untuk setiap pengguna</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
              <p className="text-sm font-semibold text-amber-500 mb-2">Atur IP Semua Agent Sekaligus</p>
              <p className="text-xs text-muted-foreground mb-3">Masukkan IP address yang akan diterapkan ke semua pengguna agent. Gunakan <code className="bg-muted px-1 rounded">*</code> untuk mengizinkan semua IP.</p>
              <div className="flex gap-2 items-center">
                <Input
                  value={bulkIp}
                  onChange={(e) => { setBulkIp(e.target.value); setShowBulkIpConfirm(false); }}
                  placeholder="Contoh: 192.168.1.1 atau *"
                  className="max-w-xs"
                  data-testid="input-bulk-ip"
                />
                {!showBulkIpConfirm ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                    onClick={() => setShowBulkIpConfirm(true)}
                    disabled={!bulkIp.trim()}
                    data-testid="button-bulk-ip-start"
                  >
                    Terapkan ke Semua
                  </Button>
                ) : (
                  <>
                    <span className="text-xs text-muted-foreground">Yakin set semua agent ke <strong>{bulkIp}</strong>?</span>
                    <Button
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600 text-black"
                      onClick={() => bulkUpdateIpMutation.mutate(bulkIp.trim())}
                      disabled={bulkUpdateIpMutation.isPending}
                      data-testid="button-bulk-ip-confirm"
                    >
                      {bulkUpdateIpMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Terapkan"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowBulkIpConfirm(false)}
                      data-testid="button-bulk-ip-cancel"
                    >
                      Batal
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="mb-4 p-4 rounded-lg border border-red-500/30 bg-red-500/5">
              <p className="text-sm font-semibold text-red-400 mb-2">Ganti Password Semua Agent Sekaligus</p>
              <p className="text-xs text-muted-foreground mb-3">Password baru yang akan diterapkan ke semua pengguna agent. Minimal 6 karakter.</p>
              <div className="flex flex-wrap gap-2 items-center">
                <Input
                  type={showBulkPass ? "text" : "password"}
                  value={bulkPassword}
                  onChange={(e) => { setBulkPassword(e.target.value); setShowBulkPassConfirm(false); }}
                  placeholder="Password baru (min. 6 karakter)"
                  className="max-w-xs"
                  data-testid="input-bulk-password"
                />
                <Input
                  type={showBulkPass ? "text" : "password"}
                  value={bulkPasswordConfirm}
                  onChange={(e) => { setBulkPasswordConfirm(e.target.value); setShowBulkPassConfirm(false); }}
                  placeholder="Konfirmasi password"
                  className="max-w-xs"
                  data-testid="input-bulk-password-confirm"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowBulkPass(!showBulkPass)}
                  className="px-2 text-muted-foreground"
                >
                  {showBulkPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              {bulkPassword && bulkPasswordConfirm && bulkPassword !== bulkPasswordConfirm && (
                <p className="text-xs text-red-400 mt-2">Password tidak cocok</p>
              )}
              <div className="flex gap-2 mt-3 items-center flex-wrap">
                {!showBulkPassConfirm ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    onClick={() => setShowBulkPassConfirm(true)}
                    disabled={!bulkPassword.trim() || bulkPassword.length < 6 || bulkPassword !== bulkPasswordConfirm}
                    data-testid="button-bulk-password-start"
                  >
                    Terapkan ke Semua
                  </Button>
                ) : (
                  <>
                    <span className="text-xs text-muted-foreground">Yakin ganti password semua agent?</span>
                    <Button
                      size="sm"
                      className="bg-red-500 hover:bg-red-600 text-white"
                      onClick={() => bulkUpdatePasswordMutation.mutate(bulkPassword.trim())}
                      disabled={bulkUpdatePasswordMutation.isPending}
                      data-testid="button-bulk-password-confirm"
                    >
                      {bulkUpdatePasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Ganti Semua"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowBulkPassConfirm(false)}
                      data-testid="button-bulk-password-cancel"
                    >
                      Batal
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="mb-4 p-4 rounded-lg border border-rose-700/40 bg-rose-700/5">
              <div className="flex items-center gap-2 mb-2">
                <UserX className="w-4 h-4 text-rose-500" />
                <p className="text-sm font-semibold text-rose-500">Hapus Semua Agent Sekaligus</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Tindakan ini akan <strong>menghapus permanen</strong> semua akun pengguna dengan role Agent. Tidak dapat dibatalkan.</p>
              <div className="flex gap-2 items-center flex-wrap">
                {!showBulkDeleteConfirm ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-rose-700/50 text-rose-500 hover:bg-rose-700/10"
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    data-testid="button-bulk-delete-agents-start"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Hapus Semua Agent
                  </Button>
                ) : (
                  <>
                    <span className="text-xs text-rose-400 font-medium">Yakin ingin menghapus SEMUA akun agent? Data tidak bisa dikembalikan!</span>
                    <Button
                      size="sm"
                      className="bg-rose-600 hover:bg-rose-700 text-white"
                      onClick={() => bulkDeleteAgentsMutation.mutate()}
                      disabled={bulkDeleteAgentsMutation.isPending}
                      data-testid="button-bulk-delete-agents-confirm"
                    >
                      {bulkDeleteAgentsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Hapus Semua"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowBulkDeleteConfirm(false)}
                      data-testid="button-bulk-delete-agents-cancel"
                    >
                      Batal
                    </Button>
                  </>
                )}
              </div>
            </div>

            {usersQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>IP yang Diizinkan</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersQuery.data?.map((u: any) => (
                      <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                        <TableCell className="font-medium">
                          {usernameEditingId === u.id ? (
                            <Input
                              value={newUsername}
                              onChange={(e) => setNewUsername(e.target.value)}
                              placeholder="Username baru"
                              data-testid={`input-username-${u.id}`}
                              className="max-w-xs"
                            />
                          ) : (
                            u.username
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            {u.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          {editingId === u.id ? (
                            <Input
                              value={editingIp}
                              onChange={(e) => setEditingIp(e.target.value)}
                              placeholder="Contoh: 192.168.1.1 atau *"
                              data-testid={`input-ip-${u.id}`}
                              className="max-w-xs"
                            />
                          ) : (
                            <code className="px-2 py-1 bg-muted rounded text-sm">{u.allowedIp || "-"}</code>
                          )}
                        </TableCell>
                        <TableCell>
                          {passwordEditingId === u.id ? (
                            <div className="flex gap-2 max-w-xs">
                              <div className="relative flex-1">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  placeholder="Password baru (min 6 karakter)"
                                  data-testid={`input-password-${u.id}`}
                                />
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowPassword(!showPassword)}
                                className="px-2"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                          ) : (
                            <code className="px-2 py-1 bg-muted rounded text-sm">••••••</code>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {editingId === u.id ? (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => updateIpMutation.mutate({ userId: u.id, allowedIp: editingIp })}
                                disabled={updateIpMutation.isPending}
                                data-testid={`button-save-ip-${u.id}`}
                              >
                                {updateIpMutation.isPending ? "..." : "Simpan"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingId(null)}
                                data-testid={`button-cancel-ip-${u.id}`}
                              >
                                Batal
                              </Button>
                            </>
                          ) : passwordEditingId === u.id ? (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => updatePasswordMutation.mutate({ userId: u.id, password: newPassword })}
                                disabled={updatePasswordMutation.isPending || newPassword.length < 6}
                                data-testid={`button-save-password-${u.id}`}
                              >
                                {updatePasswordMutation.isPending ? "..." : "Simpan"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setPasswordEditingId(null);
                                  setNewPassword("");
                                  setShowPassword(false);
                                }}
                                data-testid={`button-cancel-password-${u.id}`}
                              >
                                Batal
                              </Button>
                            </>
                          ) : usernameEditingId === u.id ? (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => updateUsernameMutation.mutate({ userId: u.id, username: newUsername })}
                                disabled={updateUsernameMutation.isPending || !newUsername.trim()}
                                data-testid={`button-save-username-${u.id}`}
                              >
                                {updateUsernameMutation.isPending ? "..." : "Simpan"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setUsernameEditingId(null);
                                  setNewUsername("");
                                }}
                                data-testid={`button-cancel-username-${u.id}`}
                              >
                                Batal
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setUsernameEditingId(u.id);
                                  setNewUsername(u.username);
                                }}
                                data-testid={`button-edit-username-${u.id}`}
                              >
                                User
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingId(u.id);
                                  setEditingIp(u.allowedIp || "");
                                }}
                                data-testid={`button-edit-ip-${u.id}`}
                              >
                                IP
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setPasswordEditingId(u.id);
                                  setNewPassword("");
                                }}
                                data-testid={`button-edit-password-${u.id}`}
                              >
                                Pass
                              </Button>
                              {u.role === "agent" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (confirm(`Hapus user "${u.username}"?`)) {
                                      deleteUser(u.id);
                                    }
                                  }}
                                  disabled={isDeletingUser}
                                  className="text-red-400 hover:text-red-300 border-red-400/30 hover:bg-red-400/10"
                                  data-testid={`button-delete-user-${u.id}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manajemen Data Staff</CardTitle>
            <CardDescription>Kelola data staff yang tampil di dashboard utama</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg border border-rose-700/40 bg-rose-700/5">
              <div className="flex items-center gap-2 mb-2">
                <UserX className="w-4 h-4 text-rose-500" />
                <p className="text-sm font-semibold text-rose-500">Hapus Semua Data Staff</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Menghapus <strong>semua nama staff</strong> dari tampilan dashboard. Data riwayat izin terkait juga akan terhapus. Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-2 items-center flex-wrap">
                {!showBulkDeleteStaffConfirm ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-rose-700/50 text-rose-500 hover:bg-rose-700/10"
                    onClick={() => setShowBulkDeleteStaffConfirm(true)}
                    data-testid="button-bulk-delete-staff-start"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Hapus Semua Staff
                  </Button>
                ) : (
                  <>
                    <span className="text-xs text-rose-400 font-medium">Yakin ingin menghapus SEMUA data staff dari dashboard?</span>
                    <Button
                      size="sm"
                      className="bg-rose-600 hover:bg-rose-700 text-white"
                      onClick={() => bulkDeleteAllStaffMutation.mutate()}
                      disabled={bulkDeleteAllStaffMutation.isPending}
                      data-testid="button-bulk-delete-staff-confirm"
                    >
                      {bulkDeleteAllStaffMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Hapus Semua"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowBulkDeleteStaffConfirm(false)}
                      data-testid="button-bulk-delete-staff-cancel"
                    >
                      Batal
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Master Kategori Jabatan */}
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-400" />
              <CardTitle className="text-orange-400">Master Kategori Jabatan</CardTitle>
            </div>
            <CardDescription>
              Kelola daftar jabatan/jobdesk master. Tambah, hapus satu per satu, atau reset semua agar tidak menumpuk.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add new jabatan */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Tambah Jabatan Baru</p>
              <div className="flex gap-2">
                <Input
                  value={newJabatan}
                  onChange={e => setNewJabatan(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && newJabatan.trim()) addJabatanMutation.mutate(newJabatan.trim()); }}
                  placeholder="Contoh: CS LINE, kasir, kapten..."
                  className="max-w-xs"
                  data-testid="input-new-jabatan"
                />
                <Button
                  size="sm"
                  onClick={() => { if (newJabatan.trim()) addJabatanMutation.mutate(newJabatan.trim()); }}
                  disabled={!newJabatan.trim() || addJabatanMutation.isPending}
                  data-testid="button-add-jabatan"
                >
                  {addJabatanMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                  Tambah
                </Button>
              </div>
            </div>

            {/* Current list */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">
                Daftar Jabatan Saat Ini
                {jabatanQuery.data?.jobdesks?.length ? (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">({jabatanQuery.data.jobdesks.length} jabatan)</span>
                ) : null}
              </p>
              {jabatanQuery.isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Memuat...</div>
              ) : !jabatanQuery.data?.jobdesks?.length ? (
                <p className="text-sm text-muted-foreground italic">Belum ada jabatan dalam master list.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {jabatanQuery.data.jobdesks.map(j => (
                    <div
                      key={j}
                      className="flex items-center gap-1.5 bg-secondary/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm"
                      data-testid={`tag-jabatan-${j}`}
                    >
                      <span className="font-medium">{j}</span>
                      <button
                        onClick={() => deleteJabatanMutation.mutate(j)}
                        disabled={deleteJabatanMutation.isPending}
                        className="text-muted-foreground hover:text-red-400 transition-colors ml-1"
                        data-testid={`button-delete-jabatan-${j}`}
                        title={`Hapus "${j}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reset all */}
            {jabatanQuery.data?.jobdesks?.length ? (
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <p className="text-sm font-semibold text-red-400">Hapus Semua Jabatan</p>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Menghapus seluruh daftar jabatan dari master list. Data staff yang sudah ada tidak akan terpengaruh, hanya daftar pilihan jabatan yang dikosongkan.
                </p>
                {!showResetJabatanConfirm ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                    onClick={() => setShowResetJabatanConfirm(true)}
                    data-testid="button-reset-jabatan-start"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Reset Semua Jabatan
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-red-400 font-medium">Yakin ingin menghapus semua {jabatanQuery.data.jobdesks.length} jabatan dari master list?</span>
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => resetJabatanMutation.mutate()}
                      disabled={resetJabatanMutation.isPending}
                      data-testid="button-reset-jabatan-confirm"
                    >
                      {resetJabatanMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Hapus Semua"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowResetJabatanConfirm(false)}
                      data-testid="button-reset-jabatan-cancel"
                    >
                      Batal
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Whitelist IP</CardTitle>
            <CardDescription>Atur daftar IP address yang diizinkan untuk login (satu per baris)</CardDescription>
          </CardHeader>
          <CardContent>
            {editingWhitelist ? (
              <div className="space-y-3">
                <Textarea
                  value={whitelistText}
                  onChange={(e) => setWhitelistText(e.target.value)}
                  placeholder="192.168.1.1&#10;192.168.1.2&#10;10.0.0.0/24"
                  className="min-h-[200px] font-mono text-sm"
                  data-testid="textarea-whitelist"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const ips = whitelistText
                        .split('\n')
                        .map(ip => ip.trim())
                        .filter(ip => ip.length > 0);
                      updateWhitelistMutation.mutate(ips);
                    }}
                    disabled={updateWhitelistMutation.isPending}
                    data-testid="button-save-whitelist"
                  >
                    {updateWhitelistMutation.isPending ? "Menyimpan..." : "Simpan"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingWhitelist(false);
                      setWhitelistText(whitelistIps.join('\n'));
                    }}
                    data-testid="button-cancel-whitelist"
                  >
                    Batal
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-muted p-4 rounded-lg min-h-[150px] overflow-auto font-mono text-sm whitespace-pre-wrap break-words">
                  {whitelistIps.length > 0 ? whitelistIps.join('\n') : 'Belum ada IP whitelist'}
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingWhitelist(true);
                    setWhitelistText(whitelistIps.join('\n'));
                  }}
                  data-testid="button-edit-whitelist"
                >
                  Edit Whitelist
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Limit Staff Per Jobdesk</CardTitle>
            <CardDescription>Atur maksimal staff yang bisa keluar bersamaan per jobdesk</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingJobdeskLimits ? (
              <>
                <Textarea
                  value={jobdeskLimitsText}
                  onChange={(e) => setJobdeskLimitsText(e.target.value)}
                  placeholder="CONTOH JOBDESK=2&#10;CS=2&#10;MARKETING=3"
                  className="font-mono"
                  rows={6}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveJobdeskLimits}
                    disabled={updateLimitsMutation.isPending}
                    size="sm"
                    data-testid="button-save-jobdesk-limits"
                  >
                    {updateLimitsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Simpan
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingJobdeskLimits(false)}
                    size="sm"
                  >
                    Batal
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {limitsQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : limitsQuery.data?.limits && Object.keys(limitsQuery.data.limits).length > 0 ? (
                  <div className="bg-secondary/30 p-4 rounded-lg">
                    {Object.entries(limitsQuery.data.limits).map(([jobdesk, limit]) => (
                      <div key={jobdesk} className="flex justify-between text-sm py-1">
                        <span className="font-medium">{jobdesk}</span>
                        <span className="text-muted-foreground">Max {String(limit)} staff bersamaan</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Belum ada limit yang diatur</p>
                )}
                <Button
                  onClick={() => setEditingJobdeskLimits(true)}
                  variant="outline"
                  size="sm"
                  data-testid="button-edit-jobdesk-limits"
                >
                  Edit Limit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Sistem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Fitur Keamanan:</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Update username dan password untuk setiap user</li>
                <li>Update IP address yang diizinkan per user</li>
                <li>Whitelist IP untuk login (opsional)</li>
                <li>Limit staff per jobdesk yang bisa keluar bersamaan</li>
                <li>Jika IP tidak sesuai → login ditolak dengan pesan "IP tidak sesuai"</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
