import { useStaff } from "@/hooks/use-staff";
import { useLeaves, useCreateLeave } from "@/hooks/use-leaves";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coffee, Briefcase, Activity } from "lucide-react";
import { TimerCell } from "./timer-cell";
import { useToast } from "@/hooks/use-toast";

export function StaffTable() {
  const { data: staffList, isLoading: isStaffLoading } = useStaff();
  const { data: leaves, isLoading: isLeavesLoading } = useLeaves();
  const { mutate: createLeave, isPending } = useCreateLeave();
  const { user } = useAuth();
  const { toast } = useToast();

  if (isStaffLoading || isLeavesLoading) {
    return (
      <Card className="glass-panel border-0 p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </Card>
    );
  }

  if (!staffList || !leaves) return null;

  const todayString = format(new Date(), "yyyy-MM-dd");
  const todaysLeaves = leaves.filter(l => l.date === todayString);

  const handleLeave = (staffId: number, currentLeavesCount: number) => {
    if (currentLeavesCount >= 4) {
      toast({
        variant: "destructive",
        title: "Limit Tercapai",
        description: "Staff ini sudah mencapai batas maksimal 4x izin hari ini.",
      });
      return;
    }
    createLeave(staffId);
  };

  // Check if user can clock in (admin can always, agent only for themselves)
  const canClockIn = (staff: any) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (user.role === "agent") {
      return staff.name === user.username;
    }
    return false;
  };

  return (
    <Card className="glass-panel border-0 overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-secondary/50 border-b border-white/5">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-display py-4">Nama Staff</TableHead>
              <TableHead className="font-display py-4">Jobdesk</TableHead>
              <TableHead className="font-display py-4 text-center">Total Hari Ini</TableHead>
              <TableHead className="font-display py-4 text-center">Timer Izin</TableHead>
              <TableHead className="font-display py-4 text-right pr-6">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  Belum ada data staff.
                </TableCell>
              </TableRow>
            ) : (
              staffList.map((staff) => {
                const staffLeavesToday = todaysLeaves.filter(l => l.staffId === staff.id);
                const leavesCount = staffLeavesToday.length;
                const isLimitReached = leavesCount >= 4;

                return (
                  <TableRow key={staff.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <TableCell className="font-medium py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-xs font-bold border border-white/10">
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        {staff.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-background/50 border-white/10 text-muted-foreground font-normal">
                        {staff.jobdesk}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        isLimitReached 
                          ? 'bg-destructive/20 text-destructive border border-destructive/30' 
                          : 'bg-primary/10 text-primary border border-primary/20'
                      }`}>
                        {leavesCount}/4
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <TimerCell leaves={staffLeavesToday} staffId={staff.id} canClockIn={canClockIn(staff)} />
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button 
                        size="sm" 
                        onClick={() => handleLeave(staff.id, leavesCount)}
                        disabled={isPending || isLimitReached}
                        className={`rounded-full px-5 transition-all ${
                          isLimitReached 
                            ? 'opacity-50 grayscale' 
                            : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5'
                        }`}
                      >
                        <Coffee className="w-3.5 h-3.5 mr-2" />
                        {isLimitReached ? 'Limit' : 'Mulai Izin'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
