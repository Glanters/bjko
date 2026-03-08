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
import { useState } from "react";
import { Loader2, Eye, EyeOff, Trash2 } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingIp, setEditingIp] = useState<string>("");
  const [passwordEditingId, setPasswordEditingId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState<string>("");
  const [usernameEditingId, setUsernameEditingId] = useState<number | null>(null);
  const [newUsername, setNewUsername] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [whitelistText, setWhitelistText] = useState<string>("");
  const [editingWhitelist, setEditingWhitelist] = useState<boolean>(false);

  const usersQuery = useQuery({
    queryKey: [api.users.list.path],
    queryFn: () => apiRequest(api.users.list.path).then(r => r.json()),
    enabled: user?.role === "admin",
  });

  const whitelistQuery = useQuery({
    queryKey: [api.whitelist.get.path],
    queryFn: () => apiRequest(api.whitelist.get.path).then(r => r.json()),
    enabled: user?.role === "admin",
  });

  const updateIpMutation = useMutation({
    mutationFn: (data: { userId: number; allowedIp: string }) =>
      apiRequest(api.users.updateIp.path.replace(":id", String(data.userId)), {
        method: "PATCH",
        body: JSON.stringify({ allowedIp: data.allowedIp }),
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

  const updatePasswordMutation = useMutation({
    mutationFn: (data: { userId: number; password: string }) =>
      apiRequest(api.users.updatePassword.path.replace(":id", String(data.userId)), {
        method: "PATCH",
        body: JSON.stringify({ password: data.password }),
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
      apiRequest(api.users.updateUsername.path.replace(":id", String(data.userId)), {
        method: "PATCH",
        body: JSON.stringify({ username: data.username }),
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

  const updateWhitelistMutation = useMutation({
    mutationFn: (ips: string[]) =>
      apiRequest(api.whitelist.update.path, {
        method: "PATCH",
        body: JSON.stringify({ ips }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.whitelist.get.path] });
      toast({ title: "Berhasil", description: "Whitelist IP telah diperbarui" });
      setEditingWhitelist(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal memperbarui whitelist", variant: "destructive" });
    },
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

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pengaturan</h1>
          <p className="text-muted-foreground">Kelola konfigurasi sistem, pengguna, dan whitelist IP</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manajemen Pengguna Agent</CardTitle>
            <CardDescription>Edit password, username, dan IP address untuk setiap pengguna</CardDescription>
          </CardHeader>
          <CardContent>
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
                      const ips = whitelistText.split('\n').filter(ip => ip.trim());
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
            <CardTitle>Informasi Sistem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Fitur Keamanan:</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Update username dan password untuk setiap user</li>
                <li>Update IP address yang diizinkan per user</li>
                <li>Whitelist IP untuk login (opsional)</li>
                <li>Jika IP tidak sesuai → login ditolak dengan pesan "IP tidak sesuai"</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
