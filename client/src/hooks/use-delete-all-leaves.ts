import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export function useDeleteAllLeaves() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (date: string) =>
      apiRequest("POST", "/api/leaves/delete-by-date", { date }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaves"] });
      toast({ title: "Berhasil", description: "Semua riwayat tanggal ini berhasil dihapus" });
    },
    onError: (error: any) => {
      const message = error?.message || "Gagal menghapus riwayat";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });
}
