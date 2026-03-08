import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

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
        throw new Error("Gagal memulai izin.");
      }

      const data = await res.json();
      return api.leaves.create.responses[201].parse(data);
    },
    onSuccess: () => {
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
