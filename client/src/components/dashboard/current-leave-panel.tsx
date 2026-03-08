import { useStaff } from "@/hooks/use-staff";
import { useLeaves } from "@/hooks/use-leaves";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, UserCheck, AlertTriangle } from "lucide-react";
import { useLeaveDuration } from "@/hooks/use-leave-settings";

function LiveTimer({ startTime, durationSeconds }: { startTime: string; durationSeconds: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const calc = () => {
      const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      setElapsed(diff);
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const isOver = elapsed >= durationSeconds;

  return (
    <span className={`font-mono text-sm font-bold tabular-nums ${isOver ? "text-red-400" : "text-emerald-400"}`}>
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </span>
  );
}

export function CurrentLeavePanel() {
  const { data: staffList } = useStaff();
  const { data: leaves } = useLeaves();
  const leaveDurationSeconds = useLeaveDuration();

  if (!staffList || !leaves) return null;

  const todayString = format(new Date(), "yyyy-MM-dd");

  // Staff currently on leave = today's leaves where clockInTime is null
  const activeLeaves = leaves
    .filter(l => l.date === todayString && !l.clockInTime)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const staffMap = Object.fromEntries(staffList.map(s => [s.id, s]));

  return (
    <Card className="glass-panel border-0 shadow-xl overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
      <CardHeader className="pb-3 border-b border-white/5 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <CardTitle className="text-base font-display">Sedang Izin Sekarang</CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            {activeLeaves.length > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
            <Badge
              variant="outline"
              className={`text-xs ${activeLeaves.length > 0 ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" : "border-white/10 text-muted-foreground"}`}
            >
              {activeLeaves.length} staff
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-3 relative z-10 px-0">
        {activeLeaves.length === 0 ? (
          <div className="flex items-center justify-center flex-col text-muted-foreground py-8 px-4">
            <UserCheck className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm text-center">Tidak ada staff yang sedang izin</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {activeLeaves.map((leave) => {
              const staff = staffMap[leave.staffId];
              if (!staff) return null;

              const elapsedMs = Date.now() - new Date(leave.startTime).getTime();
              const isOver = elapsedMs >= leaveDurationSeconds * 1000;

              return (
                <div
                  key={leave.id}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors ${isOver ? "bg-red-500/5" : ""}`}
                  data-testid={`row-active-leave-${leave.id}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 ${
                    isOver
                      ? "bg-red-500/20 border-red-500/30 text-red-400"
                      : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                  }`}>
                    {staff.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{staff.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-white/10 text-muted-foreground">
                        {staff.jobdesk}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {format(new Date(leave.startTime), "HH:mm")}
                      </span>
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <LiveTimer startTime={leave.startTime} durationSeconds={leaveDurationSeconds} />
                    {isOver && (
                      <div className="flex items-center gap-1 text-red-400">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span className="text-[10px]">Melewati</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
