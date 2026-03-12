import { useStaff } from "@/hooks/use-staff";
import { useLeaves, useCreateLeave, useResetStaffLimit } from "@/hooks/use-leaves";
import { useAuth } from "@/hooks/use-auth";
import { useState, useRef, useEffect } from "react";
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
import { Coffee, Briefcase, ChevronDown, ChevronRight, Trash2, Clock, RotateCcw } from "lucide-react";
import { TimerCell } from "./timer-cell";
import { LeaveStartModal } from "./leave-start-modal";
import { StaffSearch } from "./staff-search";
import { EditStaffDialog } from "./edit-staff-dialog";
import { useToast } from "@/hooks/use-toast";
import { useDeleteStaff } from "@/hooks/use-delete-staff";
import { useMaxLeaves } from "@/hooks/use-leave-settings";
import type { Staff, Leave } from "@shared/schema";

export function StaffTable() {
  const { data: staffList, isLoading: isStaffLoading } = useStaff();
  const { data: leaves, isLoading: isLeavesLoading } = useLeaves();
  const { mutate: createLeave, isPending } = useCreateLeave();
  const { mutate: resetLimit, isPending: isResetting } = useResetStaffLimit();
  const { user } = useAuth();
  const { toast } = useToast();
  const [expandedJobdesks, setExpandedJobdesks] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { mutate: deleteStaff, isPending: isDeletingStaff } = useDeleteStaff();
  const maxLeaves = useMaxLeaves();
  const isCreatingRef = useRef(false);
  const hasAutoOpenedRef = useRef(false);

  // Auto-reopen leave modal after F5 refresh for agents with an active leave
  useEffect(() => {
    if (hasAutoOpenedRef.current) return;
    if (!leaves || !staffList || !user) return;

    if (user.role === "agent") {
      const todayWib = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
      const myStaff = staffList.find(s => s.name === user.username);
      if (myStaff) {
        const myActiveLeave = leaves.find(l =>
          l.staffId === myStaff.id &&
          l.date === todayWib &&
          !l.clockInTime
        );
        if (myActiveLeave) {
          hasAutoOpenedRef.current = true;
          setSelectedLeave(myActiveLeave);
          setSelectedStaff(myStaff);
          setModalOpen(true);
        }
      }
    }
  }, [leaves, staffList, user]);

  if (isStaffLoading || isLeavesLoading) {
    return (
      <Card className="glass-panel border-0 p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </Card>
    );
  }

  if (!staffList || !leaves) return null;

  const todayWib = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
  const todaysLeaves = leaves.filter(l => l.date === todayWib);

  const handleLeave = (staffId: number, currentLeavesCount: number, staff: Staff) => {
    if (isCreatingRef.current) return;
    if (currentLeavesCount >= maxLeaves) {
      toast({
        variant: "destructive",
        title: "Limit Tercapai",
        description: `Staff ini sudah mencapai batas maksimal ${maxLeaves}x izin hari ini.`,
      });
      return;
    }
    isCreatingRef.current = true;
    createLeave(staffId, {
      onSuccess: (newLeave) => {
        isCreatingRef.current = false;
        setSelectedLeave(newLeave);
        setSelectedStaff(staff);
        setModalOpen(true);
      },
      onError: () => {
        isCreatingRef.current = false;
      },
    });
  };

  const canClockIn = (staff: any) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (user.role === "agent") {
      return staff.name === user.username;
    }
    return false;
  };

  // Define custom jobdesk order
  const jobdeskOrder = ["CS LINE", "CS", "KAPTEN", "KASIR"];
  
  // Exclude staff that are on cuti — they only appear on the Staff Cuti page
  const activeStaffList = staffList.filter(s => !s.cutiStatus);

  // Filter staff by search query
  const filteredStaffList = searchQuery.trim()
    ? activeStaffList.filter(staff =>
        staff.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeStaffList;

  // Regroup by jabatan after filtering — normalize to UPPERCASE for consistent sort order
  const filteredGroupedByJobdesk = filteredStaffList.reduce((acc, staff) => {
    const key = (staff.jabatan || staff.jobdesk || "").toUpperCase();
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(staff);
    return acc;
  }, {} as Record<string, Staff[]>);

  // Sort jobdesks by custom order, then alphabetically
  const sortedJobdesks = Object.keys(filteredGroupedByJobdesk).sort((a, b) => {
    const aIndex = jobdeskOrder.indexOf(a);
    const bIndex = jobdeskOrder.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });

  const toggleJobdesk = (jobdesk: string) => {
    const newExpanded = new Set(expandedJobdesks);
    if (newExpanded.has(jobdesk)) {
      newExpanded.delete(jobdesk);
    } else {
      newExpanded.add(jobdesk);
    }
    setExpandedJobdesks(newExpanded);
  };

  const StaffRow = ({ staff }: { staff: Staff }) => {
    const staffLeavesToday = todaysLeaves.filter(l => l.staffId === staff.id);
    const leavesCount = staffLeavesToday.length;
    const isLimitReached = leavesCount >= maxLeaves;
    const hasActiveLeave = staffLeavesToday.some(l => !l.clockInTime);
    const isButtonDisabled = isPending || isLimitReached || hasActiveLeave;

    return (
      <TableRow className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
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
            {staff.jabatan || staff.jobdesk}
          </Badge>
        </TableCell>
        <TableCell className="text-center">
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
            isLimitReached 
              ? 'bg-destructive/20 text-destructive border border-destructive/30' 
              : 'bg-primary/10 text-primary border border-primary/20'
          }`}>
            {leavesCount}/{maxLeaves}
          </span>
        </TableCell>
        <TableCell className="text-center">
          <TimerCell leaves={staffLeavesToday} staffId={staff.id} canClockIn={canClockIn(staff)} />
        </TableCell>
        <TableCell className="text-right pr-6 flex items-center justify-end gap-2">
          <Button 
            size="sm" 
            onClick={() => {
              if (hasActiveLeave) {
                toast({
                  variant: "destructive",
                  title: "Izin Masih Aktif",
                  description: "Harap clock in terlebih dahulu sebelum memulai izin baru.",
                });
                return;
              }
              handleLeave(staff.id, leavesCount, staff);
            }}
            disabled={isButtonDisabled}
            className={`rounded-full px-5 transition-all ${
              isLimitReached
                ? 'opacity-50 grayscale cursor-not-allowed'
                : hasActiveLeave
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400 opacity-80 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5'
            }`}
            data-testid={`button-start-leave-${staff.id}`}
          >
            {isLimitReached ? (
              <>
                <Coffee className="w-3.5 h-3.5 mr-2" />
                Limit
              </>
            ) : hasActiveLeave ? (
              <>
                <Clock className="w-3.5 h-3.5 mr-2" />
                Sedang Izin
              </>
            ) : (
              <>
                <Coffee className="w-3.5 h-3.5 mr-2" />
                {isPending ? 'Memproses...' : 'Mulai Izin'}
              </>
            )}
          </Button>
          {user?.role === "admin" && (
            <>
              {isLimitReached && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Reset limit izin "${staff.name}" hari ini? Semua record izin hari ini akan dihapus.`)) {
                      resetLimit(staff.id);
                    }
                  }}
                  disabled={isResetting}
                  title="Reset Limit Izin"
                  className="h-9 w-9 p-0 text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
                  data-testid={`button-reset-limit-${staff.id}`}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
              <EditStaffDialog staff={staff} />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (confirm(`Hapus staff "${staff.name}"?`)) {
                    deleteStaff(staff.id);
                  }
                }}
                disabled={isDeletingStaff}
                className="h-9 w-9 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                data-testid={`button-delete-staff-${staff.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <>
      <Card className="glass-panel border-0 p-4 mb-4">
        <StaffSearch value={searchQuery} onChange={setSearchQuery} />
      </Card>

      <Card className="glass-panel border-0 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          {activeStaffList.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-muted-foreground">Belum ada data staff.</p>
            </div>
          ) : filteredStaffList.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-muted-foreground">Tidak ada staff yang cocok dengan pencarian.</p>
            </div>
          ) : (
          <div className="space-y-0">
            {sortedJobdesks.map((jobdesk) => {
              const isExpanded = expandedJobdesks.has(jobdesk);
              const staffInJobdesk = groupedByJobdesk[jobdesk];
              
              return (
                <div key={jobdesk} className="border-b border-white/5 last:border-b-0">
                  {/* Jobdesk Header */}
                  <button
                    onClick={() => toggleJobdesk(jobdesk)}
                    className="w-full flex items-center gap-3 px-6 py-4 hover:bg-white/[0.03] transition-colors text-left"
                    data-testid={`button-toggle-jobdesk-${jobdesk}`}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-primary" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                    <h4 className="font-display font-semibold text-lg text-foreground">
                      {jobdesk}
                    </h4>
                    <span className="ml-auto text-sm text-muted-foreground">
                      {staffInJobdesk.length} staff
                    </span>
                  </button>

                  {/* Jobdesk Staff */}
                  {isExpanded && (
                    <div className="border-t border-white/5">
                      <Table>
                        <TableHeader className="bg-secondary/20 border-b border-white/5">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="font-display py-3 text-sm">Nama Staff</TableHead>
                            <TableHead className="font-display py-3 text-sm">Jabatan</TableHead>
                            <TableHead className="font-display py-3 text-center text-sm">Total Hari Ini</TableHead>
                            <TableHead className="font-display py-3 text-center text-sm">Timer Izin</TableHead>
                            <TableHead className="font-display py-3 text-right pr-6 text-sm">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredGroupedByJobdesk[jobdesk]?.map((staff) => (
                            <StaffRow key={staff.id} staff={staff} />
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>

      <LeaveStartModal
        open={modalOpen}
        leave={selectedLeave}
        staff={selectedStaff}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
