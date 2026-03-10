import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { Leave } from "@shared/schema";

export function useLeaves() {
  return useQuery({
    queryKey: [api.leaves.list.path],
    queryFn: async () => {
      const res = await fetch(api.leaves.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leaves");
      const data = await res.json();
      return api.leaves.list.responses[200].parse(data);
    },
    // Refetch every second to keep dashboards in sync across PCs
    refetchInterval: 1000,
  });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (staffId: number) => {
      const res = await fetch(api.leaves.create.path, {
        method: api.leaves.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal memulai izin.");
      }

      const data = await res.json();
      return api.leaves.create.responses[201].parse(data);
    },
    onSuccess: (newLeave) => {
      // Immediately insert new leave into cache so counter updates instantly
      queryClient.setQueryData([api.leaves.list.path], (old: Leave[] | undefined) => {
        if (!old) return [newLeave];
        // Avoid duplicate if polling already got it
        if (old.some(l => l.id === newLeave.id)) return old;
        return [...old, newLeave];
      });
      // Also invalidate to ensure full consistency from server
      queryClient.invalidateQueries({ queryKey: [api.leaves.list.path] });
      toast({
        title: "Izin Dimulai",
        description: "Timer izin telah berjalan.",
      });
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err.message,
      });
    },
  });
}

export function useResetStaffLimit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (staffId: number) => {
      const res = await fetch(`/api/leaves/reset/${staffId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal mereset limit.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.leaves.list.path] });
      toast({
        title: "Limit Direset",
        description: "Limit izin staff hari ini berhasil direset.",
      });
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Gagal Reset",
        description: err.message,
      });
    },
  });
}

export function useClockIn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (leaveId: number) => {
      const res = await fetch(api.leaves.clockIn.path.replace(":id", String(leaveId)), {
        method: api.leaves.clockIn.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal melakukan clock in.");
      }

      const data = await res.json();
      return api.leaves.clockIn.responses[200].parse(data);
    },
    onSuccess: async (updatedLeave) => {
      // Immediately update the cache so CurrentLeavePanel removes staff instantly
      queryClient.setQueryData([api.leaves.list.path], (old: Leave[] | undefined) => {
        if (!old) return old;
        return old.map(l => l.id === updatedLeave.id ? updatedLeave : l);
      });
      // Also refetch to ensure full consistency
      await queryClient.refetchQueries({ queryKey: [api.leaves.list.path] });
      toast({
        title: "Clock In Berhasil",
        description: "Anda sudah check in.",
      });
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err.message,
      });
    },
  });
}
