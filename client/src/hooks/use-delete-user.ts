import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export function useDeleteUser() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (userId: number) =>
      apiRequest("DELETE", api.users.delete.path.replace(":id", String(userId))).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      toast({ title: "Berhasil", description: "User berhasil dihapus" });
    },
    onError: (error: any) => {
      const message = error?.message || "Gagal menghapus user";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });
}
