import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { useLeaveHistory, useDeleteLeave, useUpdateLeaveClockIn } from "@/hooks/use-leave-history";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Trash2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Leave, Staff } from "@shared/schema";

export default function History() {
  const { user } = useAuth();
  const { data: leaves = [], isLoading } = useLeaveHistory();
  const { mutate: deleteLeave, isPending: isDeletingLeave } = useDeleteLeave();
  const { mutate: updateClockIn } = useUpdateLeaveClockIn();
  const [staffMap, setStaffMap] = useState<Record<number, Staff>>({});

  useEffect(() => {
    fetch("/api/staff", { credentials: "include" })
      .then(r => r.json())
      .then((staffList: Staff[]) => {
        const map = Object.fromEntries(staffList.map(s => [s.id, s]));
        setStaffMap(map);
      });
  }, []);

  if (!user) return null;

  const calculateStatus = (startTime: string, clockInTime: string | null) => {
    if (!clockInTime) return "BELUM CHECK IN";
    const start = new Date(startTime);
    const clockIn = new Date(clockInTime);
    const diffMs = clockIn.getTime() - start.getTime();
    const diffMinutes = diffMs / 60000;
    return diffMinutes <= 15 ? "TEPAT WAKTU" : "TERLAMBAT";
  };

  const calculateDuration = (startTime: string, clockInTime: string | null) => {
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

  // Group leaves by date
  const groupedByDate = leaves.reduce((acc, leave) => {
    const date = leave.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(leave);
    return acc;
  }, {} as Record<string, Leave[]>);

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedByDate).sort().reverse();

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

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
          </div>
        ) : leaves.length === 0 ? (
          <div className="rounded-lg border border-white/5 bg-background/40 backdrop-blur-xl p-8 text-center">
            <p className="text-muted-foreground">Belum ada data izin</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((date) => (
              <div key={date} className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                  <h3 className="text-2xl font-display font-bold text-gradient">
                    Riwayat {format(new Date(date), "dd/MM/yyyy")}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    ({groupedByDate[date].length} izin)
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
                        {user.role === "admin" && <TableHead className="text-muted-foreground text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedByDate[date].map((leave: Leave) => {
                        const staff = staffMap[leave.staffId];
                        const status = calculateStatus(leave.startTime, leave.clockInTime);
                        const isLate = status === "TERLAMBAT";

                        return (
                          <TableRow key={leave.id} className="border-white/5 hover:bg-white/5">
                            <TableCell className="font-medium">
                              {staff?.name || `Staff #${leave.staffId}`}
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
