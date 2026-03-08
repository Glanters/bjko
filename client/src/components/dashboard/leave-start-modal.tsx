import { useState, useEffect } from "react";
import { format, addMinutes } from "date-fns";
import { useClockIn } from "@/hooks/use-leaves";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle } from "lucide-react";
import type { Leave, Staff } from "@shared/schema";

interface LeaveStartModalProps {
  open: boolean;
  leave: Leave | null;
  staff: Staff | null;
  onOpenChange: (open: boolean) => void;
}

export function LeaveStartModal({ open, leave, staff, onOpenChange }: LeaveStartModalProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(15 * 60); // 15 minutes in seconds
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const { mutate: clockIn, isPending: isClockingIn } = useClockIn();

  useEffect(() => {
    if (!open || !leave) return;

    // Reset timer when modal opens
    setTimeRemaining(15 * 60);
    setClockInTime(null);

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, leave]);

  if (!leave || !staff) return null;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const startTime = new Date(leave.startTime);
  const endTime = addMinutes(startTime, 15);
  const isTimeUp = timeRemaining === 0;

  const handleClockIn = () => {
    clockIn(leave.id, {
      onSuccess: () => {
        setClockInTime(new Date());
      },
    });
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] glass-panel border-white/10 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500/30 to-emerald-500/30 flex items-center justify-center border border-teal-500/30">
              {staff.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <DialogTitle className="text-2xl font-display text-gradient">
                {staff.name}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">{staff.jobdesk}</p>
            </div>
          </div>
          <DialogDescription className="text-center text-muted-foreground">
            Sedang mengambil izin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Countdown Timer */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground text-center">Sisa Waktu Izin</p>
            <div className={`text-center py-6 rounded-xl border-2 transition-all ${
              isTimeUp
                ? "border-destructive/30 bg-destructive/5"
                : "border-primary/30 bg-primary/5"
            }`}>
              <div className={`text-5xl font-bold font-display ${
                isTimeUp ? "text-destructive" : "text-primary"
              }`}>
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {isTimeUp ? "Waktu izin habis" : "menit"}
              </p>
            </div>
          </div>

          {/* Time Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 p-3 rounded-lg bg-secondary/50 border border-white/5">
              <p className="text-xs text-muted-foreground">Jam Mulai</p>
              <p className="font-medium text-sm">
                {format(startTime, "HH:mm:ss")}
              </p>
            </div>
            <div className="space-y-2 p-3 rounded-lg bg-secondary/50 border border-white/5">
              <p className="text-xs text-muted-foreground">Batas Masuk</p>
              <p className="font-medium text-sm">
                {format(endTime, "HH:mm:ss")}
              </p>
            </div>
          </div>

          {/* Clock In Status */}
          {clockInTime ? (
            <div className="space-y-2 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-400">Sudah Check In</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Jam masuk: {format(clockInTime, "HH:mm:ss")}
              </p>
            </div>
          ) : (
            <Button
              onClick={handleClockIn}
              disabled={isClockingIn || isTimeUp}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-semibold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40"
              data-testid="button-clock-in-modal"
            >
              <Clock className="w-4 h-4 mr-2" />
              {isClockingIn ? "Memproses..." : "Check In Sekarang"}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full"
            data-testid="button-close-modal"
          >
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
