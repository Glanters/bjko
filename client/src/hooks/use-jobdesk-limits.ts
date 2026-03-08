import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export function useJobdeskLimits() {
  return useQuery({
    queryKey: [api.jobdeskLimits.get.path],
    queryFn: () =>
      apiRequest(api.jobdeskLimits.get.path).then(r => r.json()),
  });
}

export function useUpdateJobdeskLimits() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (limits: Record<string, number>) =>
      apiRequest(api.jobdeskLimits.update.path, {
        method: "PATCH",
        body: JSON.stringify({ limits }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.jobdeskLimits.get.path] });
      toast({
        title: "Berhasil",
        description: "Limit staff jobdesk telah diperbarui",
      });
    },
    onError: (error: any) => {
      const message = error?.message || "Gagal memperbarui limit";
      toast({
        variant: "destructive",
        title: "Gagal",
        description: message,
      });
    },
  });
}
