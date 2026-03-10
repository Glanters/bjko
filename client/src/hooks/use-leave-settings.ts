import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useLeaveSettings() {
  return useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
    queryFn: () => apiRequest("GET", "/api/settings").then(r => r.json()),
  });
}

export function useLeaveDuration() {
  const { data: settings } = useLeaveSettings();
  const raw = settings?.leave_duration_seconds;
  return raw ? parseInt(raw) : 900;
}

export function useMaxLeaves() {
  const { data: settings } = useLeaveSettings();
  const raw = settings?.max_leaves_per_day;
  return raw ? parseInt(raw) : 4;
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
