import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useEditStaff() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, name, jobdesk }: { id: number; name: string; jobdesk: string }) =>
      apiRequest("PATCH", `/api/staff/${id}`, { name, jobdesk }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({ title: "Berhasil", description: "Data staff berhasil diperbarui" });
    },
    onError: (error: any) => {
      const message = error?.message || "Gagal memperbarui data staff";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });
}
