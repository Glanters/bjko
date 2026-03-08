import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useLeaveSettings() {
  return useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
    queryFn: () => apiRequest("GET", "/api/settings").then(r => r.json()),
  });
}

export function useUpdateLeaveSetting() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      apiRequest("POST", "/api/settings", { key, value }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Berhasil", description: "Pengaturan berhasil disimpan" });
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal menyimpan pengaturan", variant: "destructive" });
    },
  });
}
