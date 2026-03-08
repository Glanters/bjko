import { Header } from "@/components/layout/header";
import { useAuditLogs } from "@/hooks/use-audit-log";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Shield, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const ACTION_COLORS: Record<string, string> = {
  UPDATE_STAFF: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  UPDATE_SETTING: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  BACKUP: "bg-green-500/20 text-green-400 border-green-500/30",
  RESTORE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  DELETE_STAFF: "bg-red-500/20 text-red-400 border-red-500/30",
  DELETE_LEAVE: "bg-red-500/20 text-red-400 border-red-500/30",
  DELETE_USER: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function AuditLog() {
  const { user } = useAuth();
  const { data: logs = [], isLoading } = useAuditLogs();
  const [search, setSearch] = useState("");

  if (!user) return null;

  const filtered = logs.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.username.toLowerCase().includes(search.toLowerCase()) ||
    (l.detail || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8">
          <h2 className="text-3xl font-display font-bold text-gradient flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            Audit Log
          </h2>
          <p className="text-muted-foreground mt-2">Rekam jejak setiap tindakan admin dalam sistem</p>
        </div>

        {/* Search */}
        <div className="mb-4 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari aksi, username, atau detail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-audit-search"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-white/5 bg-background/40 backdrop-blur-xl p-8 text-center">
            <p className="text-muted-foreground">{logs.length === 0 ? "Belum ada aktivitas tercatat" : "Tidak ada hasil pencarian"}</p>
          </div>
        ) : (
          <div className="rounded-lg border border-white/5 bg-background/40 backdrop-blur-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Waktu</TableHead>
                  <TableHead className="text-muted-foreground">Admin</TableHead>
                  <TableHead className="text-muted-foreground">Aksi</TableHead>
                  <TableHead className="text-muted-foreground">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(log => (
                  <TableRow key={log.id} className="border-white/5 hover:bg-white/5" data-testid={`row-audit-${log.id}`}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: idLocale })}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{log.username}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs font-mono ${ACTION_COLORS[log.action] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                      {log.detail || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4">Total {filtered.length} aktivitas tercatat</p>
      </main>
    </div>
  );
}
