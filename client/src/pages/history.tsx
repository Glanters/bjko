import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { useLeaveHistory, useDeleteLeave, useUpdateLeaveClockIn, useUpdateLeavePunishment } from "@/hooks/use-leave-history";
import { useDeleteAllLeaves } from "@/hooks/use-delete-all-leaves";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, Pencil, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Leave, Staff, StaffPermission } from "@shared/schema";

export default function History() {
  const { user } = useAuth();
  const { data: leaves = [], isLoading } = useLeaveHistory();
  const { mutate: deleteLeave, isPending: isDeletingLeave } = useDeleteLeave();
  const { mutate: updateClockIn } = useUpdateLeaveClockIn();
  const { mutate: deleteAllByDate, isPending: isDeletingAll } = useDeleteAllLeaves();
  const { mutate: updatePunishment, isPending: isSavingPunishment } = useUpdateLeavePunishment();
  const [staffMap, setStaffMap] = useState<Record<number, Staff>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("SEMUA");
  const [editingPunishmentId, setEditingPunishmentId] = useState<number | null>(null);
  const [editingPunishmentValue, setEditingPunishmentValue] = useState<string>("");

  const { data: myPerm } = useQuery<StaffPermission | null>({
    queryKey: ["/api/permissions/me"],
    queryFn: async () => {
      const res = await fetch("/api/permissions/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 0,
  });

  const canEditPunishment = user?.role === "admin" || !!myPerm?.canEditJobdesk;

  useEffect(() => {
    fetch("/api/staff", { credentials: "include" })
      .then(r => r.json())
      .then((staffList: Staff[]) => {
        const map = Object.fromEntries(staffList.map(s => [s.id, s]));
        setStaffMap(map);
      });
  }, []);

  // Group leaves by date
  const groupedByDate = leaves.reduce((acc, leave) => {
    const date = leave.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(leave);
    return acc;
  }, {} as Record<string, Leave[]>);

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedByDate).sort().reverse();

  // Set default selected date to first available — must be before early return
  useEffect(() => {
    if (!selectedDate && sortedDates.length > 0) {
      setSelectedDate(sortedDates[0]);
    }
  }, [sortedDates.length, selectedDate]);

  if (!user) return null;

  const calculateStatus = (startTime: Date | string, clockInTime: Date | string | null) => {
    if (!clockInTime) return "BELUM CHECK IN";
    const start = new Date(startTime);
    const clockIn = new Date(clockInTime);
    const diffMs = clockIn.getTime() - start.getTime();
    const diffMinutes = diffMs / 60000;
    return diffMinutes <= 15 ? "TEPAT WAKTU" : "TERLAMBAT";
  };

  const calculateDuration = (startTime: Date | string, clockInTime: Date | string | null) => {
    if (!clockInTime) return "-";
    const start = new Date(startTime);
    const clockIn = new Date(clockInTime);
    const diffMs = clockIn.getTime() - start.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleClearClockIn = (leaveId: number) => {
    if (user.role === "admin") {
      updateClockIn({ leaveId, clockInTime: null });
    }
  };

  const startEditPunishment = (leave: Leave) => {
    setEditingPunishmentId(leave.id);
    setEditingPunishmentValue(leave.punishment ?? "");
  };

  const cancelEditPunishment = () => {
    setEditingPunishmentId(null);
    setEditingPunishmentValue("");
  };

  const savePunishment = (leaveId: number) => {
    updatePunishment(
      { leaveId, punishment: editingPunishmentValue.trim() || null },
      {
        onSuccess: () => {
          setEditingPunishmentId(null);
          setEditingPunishmentValue("");
        },
      }
    );
  };

  const displayDate = selectedDate || (sortedDates.length > 0 ? sortedDates[0] : null);
  const rawDisplayLeaves: Leave[] = displayDate ? (groupedByDate[displayDate] || []) : [];
  const displayLeaves = statusFilter === "SEMUA"
    ? rawDisplayLeaves
    : rawDisplayLeaves.filter(l => calculateStatus(l.startTime, l.clockInTime) === statusFilter);

  const tepat = rawDisplayLeaves.filter(l => calculateStatus(l.startTime, l.clockInTime) === "TEPAT WAKTU").length;
  const terlambat = rawDisplayLeaves.filter(l => calculateStatus(l.startTime, l.clockInTime) === "TERLAMBAT").length;
  const belum = rawDisplayLeaves.filter(l => calculateStatus(l.startTime, l.clockInTime) === "BELUM CHECK IN").length;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8">
          <h2 className="text-3xl font-display font-bold text-gradient">
            Riwayat Izin Staff
          </h2>
          <p className="text-muted-foreground mt-2">
            {user.role === "admin" ? "Kelola dan pantau semua izin staff" : "Lihat riwayat izin Anda"}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground">Filter Tanggal:</label>
          <Select value={displayDate || ""} onValueChange={setSelectedDate}>
            <SelectTrigger className="w-40" data-testid="select-date-filter">
              <SelectValue placeholder="Pilih tanggal" />
            </SelectTrigger>
            <SelectContent>
              {sortedDates.map((date) => (
                <SelectItem key={date} value={date}>
                  {format(new Date(date), "dd/MM/yyyy")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="text-sm font-medium text-muted-foreground ml-2">Filter Status:</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SEMUA">Semua Status</SelectItem>
              <SelectItem value="TEPAT WAKTU">Tepat Waktu</SelectItem>
              <SelectItem value="TERLAMBAT">Terlambat</SelectItem>
              <SelectItem value="BELUM CHECK IN">Belum Check In</SelectItem>
            </SelectContent>
          </Select>

          {displayDate && rawDisplayLeaves.length > 0 && (
            <div className="flex items-center gap-2 ml-2">
              <Badge
                className="cursor-pointer bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"
                onClick={() => setStatusFilter(statusFilter === "TEPAT WAKTU" ? "SEMUA" : "TEPAT WAKTU")}
                data-testid="badge-filter-tepat"
              >
                Tepat Waktu: {tepat}
              </Badge>
              <Badge
                className="cursor-pointer bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                onClick={() => setStatusFilter(statusFilter === "TERLAMBAT" ? "SEMUA" : "TERLAMBAT")}
                data-testid="badge-filter-terlambat"
              >
                Terlambat: {terlambat}
              </Badge>
              {belum > 0 && (
                <Badge
                  className="cursor-pointer bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30"
                  onClick={() => setStatusFilter(statusFilter === "BELUM CHECK IN" ? "SEMUA" : "BELUM CHECK IN")}
                  data-testid="badge-filter-belum"
                >
                  Belum Check In: {belum}
                </Badge>
              )}
            </div>
          )}

          {user.role === "admin" && displayDate && rawDisplayLeaves.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  disabled={isDeletingAll}
                  data-testid="button-delete-all-leaves"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus Semua {format(new Date(displayDate), "dd/MM/yyyy")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>Hapus Semua Riwayat?</AlertDialogTitle>
                <AlertDialogDescription>
                  Anda akan menghapus {rawDisplayLeaves.length} riwayat izin pada tanggal {format(new Date(displayDate), "dd/MM/yyyy")}. Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
                <div className="flex gap-3 justify-end">
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteAllByDate(displayDate)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Hapus
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
          </div>
        ) : leaves.length === 0 ? (
          <div className="rounded-lg border border-white/5 bg-background/40 backdrop-blur-xl p-8 text-center">
            <p className="text-muted-foreground">Belum ada data izin</p>
          </div>
        ) : !displayDate || rawDisplayLeaves.length === 0 ? (
          <div className="rounded-lg border border-white/5 bg-background/40 backdrop-blur-xl p-8 text-center">
            <p className="text-muted-foreground">Tidak ada data izin untuk tanggal yang dipilih</p>
          </div>
        ) : displayLeaves.length === 0 ? (
          <div className="rounded-lg border border-white/5 bg-background/40 backdrop-blur-xl p-8 text-center">
            <p className="text-muted-foreground">Tidak ada data dengan status <span className="font-semibold text-foreground">{statusFilter}</span> untuk tanggal ini</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <h3 className="text-2xl font-display font-bold text-gradient">
                Riwayat {format(new Date(displayDate), "dd/MM/yyyy")}
              </h3>
              <span className="text-sm text-muted-foreground">
                ({displayLeaves.length}{statusFilter !== "SEMUA" ? ` dari ${rawDisplayLeaves.length}` : ""} izin)
              </span>
            </div>

            <div className="rounded-lg border border-white/5 bg-background/40 backdrop-blur-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Nama Staff</TableHead>
                    <TableHead className="text-muted-foreground">Jam Mulai</TableHead>
                    <TableHead className="text-muted-foreground">Jam Masuk</TableHead>
                    <TableHead className="text-muted-foreground">Durasi</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Hukuman</TableHead>
                    {user.role === "admin" && <TableHead className="text-muted-foreground text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayLeaves.map((leave: Leave) => {
                    const staffItem = staffMap[leave.staffId];
                    const status = calculateStatus(leave.startTime, leave.clockInTime);
                    const isLate = status === "TERLAMBAT";
                    const isEditingThis = editingPunishmentId === leave.id;

                    return (
                      <TableRow key={leave.id} className="border-white/5 hover:bg-white/5">
                        <TableCell className="font-medium">
                          {staffItem?.name || `Staff #${leave.staffId}`}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(leave.startTime), "HH:mm:ss")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {leave.clockInTime ? format(new Date(leave.clockInTime), "HH:mm:ss") : "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {calculateDuration(leave.startTime, leave.clockInTime)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={status === "TEPAT WAKTU" ? "default" : isLate ? "destructive" : "secondary"}
                            className={
                              status === "TEPAT WAKTU"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : isLate
                                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                                  : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                            }
                          >
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm min-w-[180px]">
                          {!isLate ? (
                            <span className="text-muted-foreground">–</span>
                          ) : isEditingThis ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editingPunishmentValue}
                                onChange={e => setEditingPunishmentValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === "Enter") savePunishment(leave.id);
                                  if (e.key === "Escape") cancelEditPunishment();
                                }}
                                className="h-7 text-xs px-2 w-36"
                                placeholder="Tulis hukuman..."
                                autoFocus
                                data-testid={`input-punishment-${leave.id}`}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-green-400 hover:text-green-300"
                                onClick={() => savePunishment(leave.id)}
                                disabled={isSavingPunishment}
                                data-testid={`button-save-punishment-${leave.id}`}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                                onClick={cancelEditPunishment}
                                data-testid={`button-cancel-punishment-${leave.id}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group">
                              <span
                                className={leave.punishment ? "text-orange-400 font-medium" : "text-muted-foreground italic"}
                                data-testid={`text-punishment-${leave.id}`}
                              >
                                {leave.punishment || "Belum diisi"}
                              </span>
                              {canEditPunishment && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                                  onClick={() => startEditPunishment(leave)}
                                  data-testid={`button-edit-punishment-${leave.id}`}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                        {user.role === "admin" && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {leave.clockInTime && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleClearClockIn(leave.id)}
                                  className="h-7 text-xs text-blue-400 hover:text-blue-300"
                                  data-testid={`button-clear-clock-in-${leave.id}`}
                                >
                                  <Clock className="w-3 h-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteLeave(leave.id)}
                                disabled={isDeletingLeave}
                                className="h-7 text-xs text-red-400 hover:text-red-300"
                                data-testid={`button-delete-leave-${leave.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
