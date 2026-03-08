import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export function useDeleteStaff() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (staffId: number) =>
      apiRequest("DELETE", api.staff.delete.path.replace(":id", String(staffId))).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.staff.list.path] });
      toast({ title: "Berhasil", description: "Staff berhasil dihapus" });
    },
    onError: (error: any) => {
      const message = error?.message || "Gagal menghapus staff";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });
}
