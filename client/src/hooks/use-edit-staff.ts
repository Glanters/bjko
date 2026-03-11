import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useEditStaff() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, name, jabatan }: { id: number; name: string; jabatan: string }) =>
      apiRequest("PATCH", `/api/staff/${id}`, { name, jabatan }).then(r => r.json()),
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
