import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Download, Upload, CheckCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

export default function Backup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<Date | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<any>(null);

  if (!user) return null;

  const handleDownloadBackup = async () => {
    setIsDownloading(true);
    try {
      const res = await apiRequest("GET", "/api/backup");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-bosjoko-${format(new Date(), "yyyy-MM-dd-HHmm")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLastBackupTime(new Date());
      toast({ title: "Berhasil", description: "File backup berhasil diunduh" });
    } catch {
      toast({ title: "Error", description: "Gagal mengunduh backup", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        setRestorePreview(parsed);
      } catch {
        toast({ title: "Error", description: "File backup tidak valid", variant: "destructive" });
        setRestorePreview(null);
        setRestoreFile(null);
      }
    };
    reader.readAsText(file);
  };

  const handleRestore = async () => {
    if (!restorePreview) return;
    setIsRestoring(true);
    try {
      await apiRequest("POST", "/api/restore", restorePreview);
      toast({ title: "Berhasil", description: "Pengaturan berhasil dipulihkan dari backup" });
      setRestoreFile(null);
      setRestorePreview(null);
    } catch {
      toast({ title: "Error", description: "Gagal memulihkan data", variant: "destructive" });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 relative z-10 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-display font-bold text-gradient flex items-center gap-2">
            <Database className="w-8 h-8 text-primary" />
            Data Sync & Backup
          </h2>
          <p className="text-muted-foreground mt-2">Ekspor dan impor data sistem untuk keperluan backup dan pemulihan</p>
        </div>

        <div className="space-y-6">
          {/* Export */}
          <Card className="glass-panel border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Ekspor Backup
              </CardTitle>
              <CardDescription>
                Unduh semua data (staff, riwayat izin, pengaturan) dalam format JSON untuk keperluan backup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Button
                  onClick={handleDownloadBackup}
                  disabled={isDownloading}
                  data-testid="button-download-backup"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isDownloading ? "Mengunduh..." : "Unduh Backup Sekarang"}
                </Button>
                {lastBackupTime && (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    Terakhir backup: {format(lastBackupTime, "HH:mm:ss dd/MM/yyyy")}
                  </div>
                )}
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Yang termasuk dalam backup:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Data seluruh staff (nama, jobdesk)</li>
                  <li>Riwayat izin (semua tanggal)</li>
                  <li>Pengaturan sistem (aturan izin)</li>
                  <li>Daftar user (tanpa password)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Restore */}
          <Card className="glass-panel border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-yellow-400" />
                Pulihkan dari Backup
              </CardTitle>
              <CardDescription>
                Unggah file backup JSON untuk memulihkan pengaturan sistem. Data staff dan izin tidak akan ditimpa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Proses restore hanya akan memulihkan pengaturan sistem. Staff dan riwayat izin tidak berubah.</span>
              </div>

              <div>
                <label
                  htmlFor="restore-file"
                  className="flex items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  data-testid="label-restore-file"
                >
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {restoreFile ? restoreFile.name : "Klik atau drag file backup (.json)"}
                    </p>
                  </div>
                </label>
                <input
                  id="restore-file"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileSelect}
                  data-testid="input-restore-file"
                />
              </div>

              {restorePreview && (
                <div className="p-4 rounded-lg bg-secondary/30 border border-white/5 text-sm space-y-2">
                  <p className="font-medium">Preview File Backup:</p>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <span>Diekspor pada:</span>
                    <span className="text-foreground">{restorePreview.exportedAt ? format(new Date(restorePreview.exportedAt), "dd/MM/yyyy HH:mm") : "-"}</span>
                    <span>Jumlah Staff:</span>
                    <span className="text-foreground">{restorePreview.staff?.length ?? "-"}</span>
                    <span>Jumlah Riwayat:</span>
                    <span className="text-foreground">{restorePreview.leaves?.length ?? "-"}</span>
                    <span>Pengaturan:</span>
                    <span className="text-foreground">{restorePreview.settings?.length ?? "-"} item</span>
                  </div>
                  <Button
                    onClick={handleRestore}
                    disabled={isRestoring}
                    variant="default"
                    className="mt-2"
                    data-testid="button-restore"
                  >
                    {isRestoring ? "Memulihkan..." : "Pulihkan Sekarang"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
