import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle } from "lucide-react";
import { type Leave } from "@shared/schema";
import { format } from "date-fns";

interface TimerCellProps {
  leaves: Leave[];
}

export function TimerCell({ leaves }: TimerCellProps) {
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

  if (isLate) {
    return (
      <Badge variant="destructive" className="animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Telat {formattedTime}
      </Badge>
    );
  }

  return (
    <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/30 transition-colors">
      <Clock className="w-3 h-3 mr-1" />
      {formattedTime}
    </Badge>
  );
}
