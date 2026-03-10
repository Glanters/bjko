import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export function useJobdeskLimits() {
  return useQuery({
    queryKey: [api.jobdeskLimits.get.path],
    queryFn: () =>
      apiRequest("GET", api.jobdeskLimits.get.path).then(r => r.json()),
  });
}

export function useUpdateJobdeskLimits() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (limits: Record<string, number>) =>
      apiRequest("PATCH", api.jobdeskLimits.update.path, { limits }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.jobdeskLimits.get.path] });
      toast({
        title: "Berhasil",
        description: "Limit staff jabatan telah diperbarui",
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
