import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle, LogIn } from "lucide-react";
import { type Leave } from "@shared/schema";
import { format } from "date-fns";
import { useClockIn } from "@/hooks/use-leaves";

interface TimerCellProps {
  leaves: Leave[];
  staffId?: number;
  canClockIn?: boolean;
}

export function TimerCell({ leaves, staffId, canClockIn = false }: TimerCellProps) {
  const { mutate: clockIn, isPending: isClockingIn } = useClockIn();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter for today's leaves
  const todayString = format(new Date(), "yyyy-MM-dd");
  const todaysLeaves = leaves.filter(l => l.date === todayString);

  if (todaysLeaves.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  // Get latest leave by sorting desc by start time
  const latestLeave = [...todaysLeaves].sort(
    (a, b) => new Date(b.startTime!).getTime() - new Date(a.startTime!).getTime()
  )[0];

  const startTimeMs = new Date(latestLeave.startTime!).getTime();
  const endTimeMs = startTimeMs + 15 * 60 * 1000; // +15 mins
  const remainingMs = endTimeMs - now;
  
  const isLate = remainingMs <= 0;
  
  // Format remaining time
  const absRemaining = Math.abs(remainingMs);
  const minutes = Math.floor(absRemaining / 60000);
  const seconds = Math.floor((absRemaining % 60000) / 1000);
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col gap-2">
      {latestLeave.clockInTime ? (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          <LogIn className="w-3 h-3 mr-1" />
          Masuk {format(new Date(latestLeave.clockInTime), "HH:mm:ss")}
        </Badge>
      ) : (
        <>
          {isLate ? (
            <Badge variant="destructive" className="animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Telat {formattedTime}
            </Badge>
          ) : (
            <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/30 transition-colors">
              <Clock className="w-3 h-3 mr-1" />
              {formattedTime}
            </Badge>
          )}
          {canClockIn && !latestLeave.clockInTime && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => clockIn(latestLeave.id)}
              disabled={isClockingIn}
              className="h-7 text-xs"
              data-testid={`button-clock-in-${staffId}`}
            >
              <LogIn className="w-3 h-3 mr-1" />
              {isClockingIn ? "Checking in..." : "Clock In"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
