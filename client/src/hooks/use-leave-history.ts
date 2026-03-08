import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useLeaveHistory() {
  return useQuery({
    queryKey: [api.leaves.list.path],
    queryFn: async () => {
      const res = await fetch(api.leaves.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leaves");
      const data = await res.json();
      return api.leaves.list.responses[200].parse(data);
    },
    refetchInterval: 5000,
  });
}

export function useDeleteLeave() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (leaveId: number) => {
      const res = await fetch(api.leaves.delete.path.replace(":id", String(leaveId)), {
        method: api.leaves.delete.method,
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal menghapus izin.");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.leaves.list.path] });
      toast({
        title: "Berhasil",
        description: "Izin telah dihapus.",
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

export function useUpdateLeaveClockIn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ leaveId, clockInTime }: { leaveId: number; clockInTime: null }) => {
      const res = await fetch(api.leaves.update.path.replace(":id", String(leaveId)), {
        method: api.leaves.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clockInTime }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal memperbarui izin.");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.leaves.list.path] });
      toast({
        title: "Berhasil",
        description: "Izin telah diperbarui.",
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
