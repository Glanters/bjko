import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingIp, setEditingIp] = useState<string>("");

  const usersQuery = useQuery({
    queryKey: [api.users.list.path],
    queryFn: () => apiRequest(api.users.list.path).then(r => r.json()),
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

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pengaturan</h1>
          <p className="text-muted-foreground">Kelola konfigurasi sistem dan IP pengguna</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manajemen IP Pengguna</CardTitle>
            <CardDescription>Atur IP address yang diizinkan untuk setiap pengguna. Gunakan "*" untuk membolehkan semua IP</CardDescription>
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
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersQuery.data?.map((u: any) => (
                      <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                        <TableCell className="font-medium">{u.username}</TableCell>
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
                        <TableCell className="text-right space-x-2">
                          {editingId === u.id ? (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => updateIpMutation.mutate({ userId: u.id, allowedIp: editingIp })}
                                disabled={updateIpMutation.isPending}
                                data-testid={`button-save-ip-${u.id}`}
                              >
                                {updateIpMutation.isPending ? "Menyimpan..." : "Simpan"}
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
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(u.id);
                                setEditingIp(u.allowedIp || "");
                              }}
                              data-testid={`button-edit-ip-${u.id}`}
                            >
                              Edit
                            </Button>
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
            <CardTitle>Informasi IP Saat Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                IP address Anda saat ini dideteksi oleh server. Saat login, IP Anda akan dibandingkan dengan konfigurasi yang diizinkan.
              </p>
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Catatan: Untuk IP yang dinamis atau berubah-ubah, gunakan "*" untuk mengizinkan semua koneksi dari IP apapun.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
