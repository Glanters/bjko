import { Header } from "@/components/layout/header";
import { useAuditLogs } from "@/hooks/use-audit-log";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Shield, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
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

const PER_PAGE_OPTIONS = [
  { label: "25 per halaman", value: "25" },
  { label: "50 per halaman", value: "50" },
  { label: "100 per halaman", value: "100" },
  { label: "Tampilkan Semua", value: "all" },
];

export default function AuditLog() {
  const { user } = useAuth();
  const { data: logs = [], isLoading } = useAuditLogs();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState<string>("25");

  if (!user) return null;

  const filtered = logs.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.username.toLowerCase().includes(search.toLowerCase()) ||
    (l.detail || "").toLowerCase().includes(search.toLowerCase())
  );

  const showAll = perPage === "all";
  const pageSize = showAll ? filtered.length : parseInt(perPage, 10);
  const totalPages = showAll ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = showAll ? 0 : (safePage - 1) * pageSize;
  const endIdx = showAll ? filtered.length : Math.min(startIdx + pageSize, filtered.length);
  const paginated = filtered.slice(startIdx, endIdx);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handlePerPageChange = (val: string) => {
    setPerPage(val);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

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

        {/* Controls: Search + Per-page */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari aksi, username, atau detail..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="pl-9"
              data-testid="input-audit-search"
            />
          </div>
          <Select value={perPage} onValueChange={handlePerPageChange}>
            <SelectTrigger className="w-[180px] h-9 text-sm border-white/10 bg-background/50" data-testid="select-per-page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PER_PAGE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <>
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
                  {paginated.map(log => (
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

            {/* Pagination bar */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {showAll
                  ? `Menampilkan semua ${filtered.length} aktivitas`
                  : `${startIdx + 1}–${endIdx} dari ${filtered.length} aktivitas`}
              </p>

              {!showAll && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  {/* First */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => goToPage(1)}
                    disabled={safePage === 1}
                    className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30"
                    data-testid="button-page-first"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  {/* Prev */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => goToPage(safePage - 1)}
                    disabled={safePage === 1}
                    className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30"
                    data-testid="button-page-prev"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  {/* Page numbers */}
                  {getPageNumbers().map((p, i) =>
                    p === "..." ? (
                      <span key={`ellipsis-${i}`} className="h-8 w-8 flex items-center justify-center text-xs text-muted-foreground select-none">…</span>
                    ) : (
                      <Button
                        key={p}
                        variant="ghost"
                        size="sm"
                        onClick={() => goToPage(p as number)}
                        className={`h-8 w-8 p-0 rounded-lg text-xs font-bold transition-colors ${
                          safePage === p
                            ? "bg-primary/20 border border-primary/30 text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        data-testid={`button-page-${p}`}
                      >
                        {p}
                      </Button>
                    )
                  )}

                  {/* Next */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => goToPage(safePage + 1)}
                    disabled={safePage === totalPages}
                    className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30"
                    data-testid="button-page-next"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  {/* Last */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => goToPage(totalPages)}
                    disabled={safePage === totalPages}
                    className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-30"
                    data-testid="button-page-last"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
